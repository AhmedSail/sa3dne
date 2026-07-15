import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidType,
  camp,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const addLineSchema = z.object({
  campId: z.string().min(1, "Camp is required"),
  aidTypeId: z.string().min(1, "Aid type is required"),
  plannedQuantity: z.number().int().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  plannedDeliveryDate: z.string().optional().nullable(),
});

/**
 * POST /api/contributions/[id]/lines
 * Adds a per-camp line to a draft contribution. Enforces quantity > 0, and
 * that the camp and aid type are both active/selectable.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [contribution] = await db
    .select()
    .from(aidContribution)
    .where(eq(aidContribution.id, id))
    .limit(1);

  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }

  // Access: admin, or the owning active provider.
  if (session.user.role !== "admin") {
    const provider = await getActiveProviderForUser(session.user.id);
    if (!provider || provider.id !== contribution.providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (contribution.status !== "draft") {
    return NextResponse.json(
      { error: "Lines can only be added to a draft contribution" },
      { status: 409 },
    );
  }

  try {
    const body = await request.json();
    const parsed = addLineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Camp must exist, be an active record, and not be closed.
    const [campRow] = await db
      .select()
      .from(camp)
      .where(eq(camp.id, parsed.data.campId))
      .limit(1);
    if (!campRow) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }
    if (campRow.status !== "active" || campRow.operationalStatus === "closed") {
      return NextResponse.json(
        { error: "Inactive or closed camp cannot be selected" },
        { status: 400 },
      );
    }

    // Aid type must exist and be active.
    const [aidTypeRow] = await db
      .select()
      .from(aidType)
      .where(eq(aidType.id, parsed.data.aidTypeId))
      .limit(1);
    if (!aidTypeRow) {
      return NextResponse.json({ error: "Aid type not found" }, { status: 404 });
    }
    if (aidTypeRow.status !== "active") {
      return NextResponse.json(
        { error: "Inactive aid type cannot be selected" },
        { status: 400 },
      );
    }

    const now = new Date();
    const newLine = {
      id: crypto.randomUUID(),
      contributionId: id,
      campId: parsed.data.campId,
      aidTypeId: parsed.data.aidTypeId,
      plannedQuantity: parsed.data.plannedQuantity,
      unit: parsed.data.unit,
      plannedDeliveryDate: parsed.data.plannedDeliveryDate
        ? new Date(parsed.data.plannedDeliveryDate)
        : null,
      status: "pending" as const,
      actualReceivedQuantity: null,
      actualReceiptDate: null,
      confirmationNotes: null,
      rejectionReason: null,
      confirmedById: null,
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(aidContributionLine).values(newLine);
    // Touch the header so updatedAt reflects the change.
    await db
      .update(aidContribution)
      .set({ updatedAt: now })
      .where(eq(aidContribution.id, id));

    return NextResponse.json(
      {
        ...newLine,
        campName: campRow.name,
        aidTypeName: aidTypeRow.name,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding contribution line:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
