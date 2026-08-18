import { db } from "@/db";
import { aidContribution, aidContributionLine } from "@/db/schema";
import { guardApi } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const guard = await guardApi(req, "contribution", "read");
    if (!guard.ok) return guard.response;

    const provider = await getActiveProviderForUser(guard.actor.id);
    if (!provider) {
      return NextResponse.json({ error: "No active provider profile found." }, { status: 403 });
    }

    const { notes, lines } = await req.json();

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "No contribution lines provided" }, { status: 400 });
    }

    // Wrap in a transaction
    const contributionId = crypto.randomUUID();
    
    await db.transaction(async (tx) => {
      // 1. Create the contribution record directly as 'submitted'
      await tx.insert(aidContribution).values({
        id: contributionId,
        providerId: provider.id,
        status: "submitted",
        notes: notes || null,
        submittedAt: new Date(),
      });

      // 2. Insert all lines
      for (const line of lines) {
        await tx.insert(aidContributionLine).values({
          id: crypto.randomUUID(),
          contributionId: contributionId,
          campId: line.campId,
          aidTypeId: line.aidTypeId,
          plannedQuantity: Number(line.plannedQuantity),
          unit: line.unit,
          plannedDeliveryDate: line.plannedDeliveryDate ? new Date(line.plannedDeliveryDate) : null,
          status: "pending", // Waiting for camp to receive it
        });
      }
    });

    return NextResponse.json({ id: contributionId }, { status: 201 });
  } catch (error: any) {
    console.error("Error in bulk contribution creation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
