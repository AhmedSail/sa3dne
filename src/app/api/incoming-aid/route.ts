import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/incoming-aid
 * Lists submitted contribution lines as incoming aid. A Camp Manager sees only
 * lines for their assigned camps; an admin sees all. Draft contributions are
 * never visible here.
 */
export async function GET(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const isAdmin = role === "admin";
  const isCampManager = role === "camp_manager";
  if (!isAdmin && !isCampManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let assignedCampIds: string[] = [];
  if (isCampManager) {
    assignedCampIds = await getAssignedCampIds(session.user.id);
    if (assignedCampIds.length === 0) {
      return NextResponse.json([]);
    }
  }

  const filters = [
    // Only lines whose parent contribution has been submitted.
    eq(aidContribution.status, "submitted"),
    // Defensive: never surface anything still in draft.
    ne(aidContribution.status, "draft"),
  ];
  if (isCampManager) {
    filters.push(inArray(aidContributionLine.campId, assignedCampIds));
  }

  const rows = await db
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
    .where(and(...filters))
    .orderBy(desc(aidContribution.submittedAt));

  return NextResponse.json(rows);
}
