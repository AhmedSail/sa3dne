import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import { guardApi } from "@/lib/auth/guard";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/incoming-aid
 * Lists submitted contribution lines as incoming aid. A Camp Manager sees only
 * lines for their assigned camps; an admin sees all. Draft contributions are
 * never visible here.
 */
export async function GET(request: NextRequest) {
  // Receiving is a camp-side action, so only a role holding
  // `contribution.receive` ever sees the incoming-aid queue.
  const guard = await guardApi(request, "contribution", "receive");
  if (!guard.ok) return guard.response;

  const assignedCampIds = guard.campIds;
  const isCampManager = assignedCampIds !== null;
  if (isCampManager && assignedCampIds.length === 0) {
    return NextResponse.json([]);
  }

  const filters = [
    // Never show draft contributions on the incoming-aid side.
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
