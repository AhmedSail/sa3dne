import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateContributionSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * Loads a contribution and enforces access: admin can read any, a provider can
 * read only their own. Returns { contribution, provider, forbidden, notFound }.
 */
async function loadScoped(session: any, id: string) {
  const rows = await db
    .select()
    .from(aidContribution)
    .where(eq(aidContribution.id, id))
    .limit(1);
  const contribution = rows[0];
  if (!contribution) return { notFound: true as const };

  if (session.user.role === "admin") {
    return { contribution };
  }

  const provider = await getActiveProviderForUser(session.user.id);
  if (!provider || provider.id !== contribution.providerId) {
    return { forbidden: true as const };
  }
  return { contribution, provider };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const scoped = await loadScoped(session, id);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [providerRow] = await db
    .select({ name: aidProvider.name, type: aidProvider.type })
    .from(aidProvider)
    .where(eq(aidProvider.id, scoped.contribution.providerId))
    .limit(1);

  const lines = await db
    .select({
      id: aidContributionLine.id,
      campId: aidContributionLine.campId,
      campName: camp.name,
      aidTypeId: aidContributionLine.aidTypeId,
      aidTypeName: aidType.name,
      plannedQuantity: aidContributionLine.plannedQuantity,
      unit: aidContributionLine.unit,
      plannedDeliveryDate: aidContributionLine.plannedDeliveryDate,
      status: aidContributionLine.status,
      actualReceivedQuantity: aidContributionLine.actualReceivedQuantity,
      actualReceiptDate: aidContributionLine.actualReceiptDate,
      confirmationNotes: aidContributionLine.confirmationNotes,
      rejectionReason: aidContributionLine.rejectionReason,
    })
    .from(aidContributionLine)
    .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
    .innerJoin(aidType, eq(aidContributionLine.aidTypeId, aidType.id))
    .where(eq(aidContributionLine.contributionId, id));

  return NextResponse.json({
    ...scoped.contribution,
    providerName: providerRow?.name ?? null,
    providerType: providerRow?.type ?? null,
    lines,
  });
}

/**
 * PUT /api/contributions/[id]
 * Update draft header notes. A submitted contribution cannot be edited.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const scoped = await loadScoped(session, id);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (scoped.contribution.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft contributions can be edited" },
      { status: 409 },
    );
  }

  try {
    const body = await request.json();
    const parsed = updateContributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await db
      .update(aidContribution)
      .set({ notes: parsed.data.notes ?? null, updatedAt: new Date() })
      .where(eq(aidContribution.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating contribution:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/contributions/[id]
 * Discards a draft contribution (and its lines via cascade). Submitted
 * contributions cannot be deleted through this flow.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const scoped = await loadScoped(session, id);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (scoped.contribution.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft contributions can be deleted" },
      { status: 409 },
    );
  }

  try {
    await db.delete(aidContribution).where(eq(aidContribution.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contribution:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
