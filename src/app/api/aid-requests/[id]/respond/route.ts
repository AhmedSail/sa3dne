import { db } from "@/db";
import { aidRequest, aidRequestResponse, aidContribution, aidContributionLine } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const respondSchema = z.object({
  committedQuantity: z.number().int().positive("Quantity must be greater than zero"),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/aid-requests/[id]/respond
 * A provider commits to fulfilling a portion (or all) of an aid request.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only providers (or admins acting as providers) can respond
  if (session.user.role === "camp_manager" || session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const provider = await getActiveProviderForUser(session.user.id);
  if (!provider && session.user.role !== "admin") {
    return NextResponse.json({ error: "No active provider profile found" }, { status: 403 });
  }
  
  // For admin without a provider profile, we shouldn't allow response unless they have one
  if (!provider) {
    return NextResponse.json({ error: "Admin must have a provider profile to respond" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Wrap in a transaction to ensure atomic fulfillment updates
    return await db.transaction(async (tx) => {
      // 1. Lock the request row and check current status
      const [targetRequest] = await tx
        .select()
        .from(aidRequest)
        .where(eq(aidRequest.id, id))
        .for("update")
        .limit(1);

      if (!targetRequest) {
        return NextResponse.json({ error: "Aid request not found" }, { status: 404 });
      }

      if (targetRequest.status === "fulfilled" || targetRequest.status === "cancelled") {
        return NextResponse.json(
          { error: `This request is already ${targetRequest.status}` },
          { status: 409 }
        );
      }

      const remainingQuantity = targetRequest.requestedQuantity - targetRequest.fulfilledQuantity;
      
      if (parsed.data.committedQuantity > remainingQuantity) {
        return NextResponse.json(
          { error: `You cannot commit more than the remaining quantity (${remainingQuantity}).` },
          { status: 400 }
        );
      }

      const now = new Date();

      // 2. Automatically create an aid contribution for this commitment
      const contributionId = crypto.randomUUID();
      await tx.insert(aidContribution).values({
        id: contributionId,
        providerId: provider.id,
        status: "submitted",
        notes: `Automatically generated from Aid Request Response. Notes: ${parsed.data.notes || 'None'}`,
        submittedAt: now,
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      });

      const lineId = crypto.randomUUID();
      await tx.insert(aidContributionLine).values({
        id: lineId,
        contributionId: contributionId,
        campId: targetRequest.campId,
        aidTypeId: targetRequest.aidTypeId,
        plannedQuantity: parsed.data.committedQuantity,
        unit: targetRequest.unit,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      // 3. Create the response record
      const newResponse = {
        id: crypto.randomUUID(),
        requestId: targetRequest.id,
        providerId: provider.id,
        committedQuantity: parsed.data.committedQuantity,
        notes: parsed.data.notes ?? null,
        status: "committed" as const,
        respondedById: session.user.id,
        createdAt: now,
        updatedAt: now,
      };

      await tx.insert(aidRequestResponse).values(newResponse);

      // 4. Update the request's fulfilled quantity and status
      const newFulfilledQuantity = targetRequest.fulfilledQuantity + parsed.data.committedQuantity;
      const newStatus = newFulfilledQuantity >= targetRequest.requestedQuantity ? "fulfilled" : "in_progress";

      await tx
        .update(aidRequest)
        .set({
          fulfilledQuantity: newFulfilledQuantity,
          status: newStatus,
          updatedAt: now,
        })
        .where(eq(aidRequest.id, id));

      return NextResponse.json({ success: true, data: newResponse }, { status: 201 });
    });
  } catch (error) {
    console.error("Error responding to aid request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
