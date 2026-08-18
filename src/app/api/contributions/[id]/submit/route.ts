import { db } from "@/db";
import { aidContribution, aidContributionLine } from "@/db/schema";
import { can, guardApi } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { AuditAction, logAudit } from "@/lib/audit";
import { notifyCampManagersOfSubmission } from "@/lib/notifications/service";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/contributions/[id]/submit
 * Submits a draft contribution. Requires at least one valid line. On success
 * the header becomes `submitted` and every line becomes `pending`, at which
 * point the lines become visible to the relevant Camp Managers.
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

  // Only the owning provider may edit a draft; a role that reads every
  // contribution is not bound to a provider profile.
  if (!can(guard.actor.role, "contribution", "receive")) {
    const provider = await getActiveProviderForUser(guard.actor.id);
    if (!provider || provider.id !== contribution.providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (contribution.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft contributions can be submitted" },
      { status: 409 },
    );
  }

  const lines = await db
    .select({ id: aidContributionLine.id })
    .from(aidContributionLine)
    .where(eq(aidContributionLine.contributionId, id));

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "A contribution must contain at least one valid line to be submitted" },
      { status: 400 },
    );
  }

  try {
    const now = new Date();
    await db
      .update(aidContribution)
      .set({ status: "submitted", submittedAt: now, updatedAt: now })
      .where(eq(aidContribution.id, id));

    await db
      .update(aidContributionLine)
      .set({ status: "pending", updatedAt: now })
      .where(eq(aidContributionLine.contributionId, id));

    // Accountability + notify the relevant Camp Managers (best-effort; must not
    // fail the submission itself).
    await logAudit({
      userId: guard.actor.id,
      action: AuditAction.CONTRIBUTION_SUBMIT,
      entityType: "contribution",
      entityId: id,
      oldValue: { status: contribution.status },
      newValue: { status: "submitted", lineCount: lines.length },
      request,
    });
    await notifyCampManagersOfSubmission(id);

    return NextResponse.json({ success: true, status: "submitted" });
  } catch (error) {
    console.error("Error submitting contribution:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
