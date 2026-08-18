import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import { isWithinCampScope, guardApi, type CampScope } from "@/lib/auth/guard";
import {
  allowedActionsFor,
  buildReceiptUpdate,
  confirmSchema,
} from "@/lib/contributions/receipt";
import { AuditAction, logAudit } from "@/lib/audit";
import { notifyProviderOfReceipt } from "@/lib/notifications/service";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function loadLineScoped(campIds: CampScope, lineId: string) {
  const rows = await db
    .select({
      line: aidContributionLine,
      contributionStatus: aidContribution.status,
    })
    .from(aidContributionLine)
    .innerJoin(
      aidContribution,
      eq(aidContributionLine.contributionId, aidContribution.id),
    )
    .where(eq(aidContributionLine.id, lineId))
    .limit(1);

  const found = rows[0];
  if (!found) return { notFound: true as const };

  if (!isWithinCampScope(campIds, found.line.campId)) {
    return { forbidden: true as const };
  }
  return { line: found.line, contributionStatus: found.contributionStatus };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> },
) {
  // Confirming receipt is a camp-side action gated by `contribution.receive`.
  const guard = await guardApi(request, "contribution", "receive");
  if (!guard.ok) return guard.response;

  const { lineId } = await params;
  const scoped = await loadLineScoped(guard.campIds, lineId);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Only submitted contributions surface on the incoming-aid side; drafts and
  // cancelled contributions stay invisible.
  if (scoped.contributionStatus !== "submitted") {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const [detail] = await db
    .select({
      id: aidContributionLine.id,
      contributionId: aidContributionLine.contributionId,
      campId: aidContributionLine.campId,
      campName: camp.name,
      aidTypeName: aidType.name,
      providerName: aidProvider.name,
      plannedQuantity: aidContributionLine.plannedQuantity,
      unit: aidContributionLine.unit,
      plannedDeliveryDate: aidContributionLine.plannedDeliveryDate,
      status: aidContributionLine.status,
      actualReceivedQuantity: aidContributionLine.actualReceivedQuantity,
      actualReceiptDate: aidContributionLine.actualReceiptDate,
      confirmationNotes: aidContributionLine.confirmationNotes,
      rejectionReason: aidContributionLine.rejectionReason,
      submittedAt: aidContribution.submittedAt,
    })
    .from(aidContributionLine)
    .innerJoin(
      aidContribution,
      eq(aidContributionLine.contributionId, aidContribution.id),
    )
    .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
    .innerJoin(aidType, eq(aidContributionLine.aidTypeId, aidType.id))
    .innerJoin(aidProvider, eq(aidContribution.providerId, aidProvider.id))
    .where(eq(aidContributionLine.id, lineId))
    .limit(1);

  return NextResponse.json(detail);
}

/**
 * PATCH /api/incoming-aid/[lineId]
 * Camp Manager (or admin) confirms receipt of a single line.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> },
) {
  // Confirming receipt is a camp-side action gated by `contribution.receive`.
  const guard = await guardApi(request, "contribution", "receive");
  if (!guard.ok) return guard.response;

  const { lineId } = await params;
  const scoped = await loadLineScoped(guard.campIds, lineId);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Only a live, submitted contribution can be received: a draft was never
  // promised and a cancelled one has been withdrawn.
  if (scoped.contributionStatus !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted contribution lines can be confirmed" },
      { status: 409 },
    );
  }

  // Settled lines (received / rejected) accept no further action, and a
  // partially received line only accepts "complete".
  const allowed = allowedActionsFor(scoped.line.status);
  if (allowed.length === 0) {
    return NextResponse.json(
      { error: "This line is already settled and cannot be confirmed again" },
      { status: 409 },
    );
  }

  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // A stale page could still post an action the line has outgrown.
    if (!allowed.includes(parsed.data.action)) {
      return NextResponse.json(
        {
          error: `Action '${parsed.data.action}' is not allowed for a line in status '${scoped.line.status}'`,
        },
        { status: 409 },
      );
    }

    const decision = buildReceiptUpdate(scoped.line, parsed.data, {
      userId: guard.actor.id,
      now: new Date(),
    });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.error }, { status: 400 });
    }

    await db
      .update(aidContributionLine)
      .set(decision.updates)
      .where(eq(aidContributionLine.id, lineId));

    // ── Auto-update parent contribution status ──────────────────────────────
    // Note: The parent 'aid_contribution' table uses an enum that only supports
    // 'draft', 'submitted', and 'cancelled'. The detailed receipt lifecycle 
    // (received, partially_received, etc.) is tracked solely on the lines.
    // Therefore, we don't need to mutate the parent status here.
    // ────────────────────────────────────────────────────────────────────────

    // Accountability + notify the owning provider (best-effort).
    await logAudit({
      userId: guard.actor.id,
      action: AuditAction.RECEIPT_STATUS_CHANGE,
      entityType: "contribution_line",
      entityId: lineId,
      oldValue: { status: scoped.line.status },
      newValue: { status: decision.updates.status },
      request,
    });
    await notifyProviderOfReceipt(lineId);

    return NextResponse.json({ success: true, status: decision.updates.status });
  } catch (error) {
    console.error("Error confirming receipt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
