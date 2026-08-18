import { db } from "@/db";
import { aidContribution, aidContributionLine } from "@/db/schema";
import { can, guardApi } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { isCancellable } from "@/lib/contributions/status";
import { AuditAction, logAudit } from "@/lib/audit";
import { notifyOfContributionCancellation } from "@/lib/notifications/service";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/contributions/[id]/cancel
 *
 * Withdraws a submitted contribution that no camp has acted on yet. Once a Camp
 * Manager has confirmed, partially confirmed or rejected any line, the receipt
 * history is real and the contribution can no longer be withdrawn — the state
 * is re-read and re-checked here rather than trusted from a hidden button.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "contribution", "read");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const [contribution] = await db
    .select()
    .from(aidContribution)
    .where(eq(aidContribution.id, id))
    .limit(1);

  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }

  // Cancelling is the provider withdrawing their own promise.
  if (!can(guard.actor.role, "contribution", "receive")) {
    const provider = await getActiveProviderForUser(guard.actor.id);
    if (!provider || provider.id !== contribution.providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const lines = await db
    .select({ status: aidContributionLine.status })
    .from(aidContributionLine)
    .where(eq(aidContributionLine.contributionId, id));

  if (!isCancellable(contribution.status, lines.map((l) => l.status))) {
    return NextResponse.json(
      {
        error:
          "Only a submitted contribution with no confirmed line can be cancelled",
      },
      { status: 409 },
    );
  }

  try {
    const now = new Date();
    await db
      .update(aidContribution)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(aidContribution.id, id));

    // Best-effort accountability and notice; neither may fail the cancellation.
    await logAudit({
      userId: guard.actor.id,
      action: AuditAction.CONTRIBUTION_CANCEL,
      entityType: "contribution",
      entityId: id,
      oldValue: { status: contribution.status },
      newValue: { status: "cancelled" },
      request,
    });
    await notifyOfContributionCancellation(id);

    return NextResponse.json({ success: true, status: "cancelled" });
  } catch (error) {
    console.error("Error cancelling contribution:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
