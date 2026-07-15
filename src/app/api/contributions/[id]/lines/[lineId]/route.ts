import { db } from "@/db";
import { aidContribution, aidContributionLine } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/contributions/[id]/lines/[lineId]
 * Removes a line from a draft contribution.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, lineId } = await params;
  const [contribution] = await db
    .select()
    .from(aidContribution)
    .where(eq(aidContribution.id, id))
    .limit(1);

  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }

  if (session.user.role !== "admin") {
    const provider = await getActiveProviderForUser(session.user.id);
    if (!provider || provider.id !== contribution.providerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (contribution.status !== "draft") {
    return NextResponse.json(
      { error: "Lines can only be removed from a draft contribution" },
      { status: 409 },
    );
  }

  try {
    await db
      .delete(aidContributionLine)
      .where(
        and(
          eq(aidContributionLine.id, lineId),
          eq(aidContributionLine.contributionId, id),
        ),
      );
    await db
      .update(aidContribution)
      .set({ updatedAt: new Date() })
      .where(eq(aidContribution.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing contribution line:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
