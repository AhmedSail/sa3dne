import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
  user,
} from "@/db/schema";
import ProviderDetails from "@/components/Providers/ProviderDetails";
import { can, guardPage } from "@/lib/auth/guard";
import { and, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Line statuses that mean aid actually arrived at the camp. */
const ARRIVED = new Set(["received", "partially_received"]);

export default async function ProviderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { actor, campIds } = await guardPage("provider", "read");

  const { id } = await params;

  const providerData = await db
    .select({
      provider: aidProvider,
      userName: user.name,
      userEmail: user.email,
    })
    .from(aidProvider)
    .leftJoin(user, eq(aidProvider.linkedUserId, user.id))
    .where(eq(aidProvider.id, id))
    .limit(1);

  if (providerData.length === 0) {
    notFound();
  }

  // The linked account's name and e-mail are user data, shown only to a role
  // that may read user records.
  const showsLinkedAccount = can(actor.role, "user", "read");
  const formattedProvider = {
    ...providerData[0].provider,
    linkedUserName: showsLinkedAccount ? providerData[0].userName : null,
    linkedUserEmail: showsLinkedAccount ? providerData[0].userEmail : null,
  };

  // What this provider actually delivered. Only submitted contributions count:
  // a draft is the provider's private worksheet, not part of the record. A
  // Camp Manager sees only the lines landing in a camp they are assigned to.
  const lines = await db
    .select({
      id: aidContributionLine.id,
      contributionId: aidContributionLine.contributionId,
      date: aidContributionLine.actualReceiptDate,
      plannedDate: aidContributionLine.plannedDeliveryDate,
      submittedAt: aidContribution.submittedAt,
      aidTypeName: aidType.name,
      campId: camp.id,
      campName: camp.name,
      campLocation: camp.location,
      campStatus: camp.operationalStatus,
      plannedQuantity: aidContributionLine.plannedQuantity,
      actualQuantity: aidContributionLine.actualReceivedQuantity,
      unit: aidContributionLine.unit,
      status: aidContributionLine.status,
    })
    .from(aidContributionLine)
    .innerJoin(
      aidContribution,
      eq(aidContributionLine.contributionId, aidContribution.id),
    )
    .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
    .innerJoin(aidType, eq(aidContributionLine.aidTypeId, aidType.id))
    .where(
      and(
        eq(aidContribution.providerId, id),
        eq(aidContribution.status, "submitted"),
        campIds ? inArray(aidContributionLine.campId, campIds) : undefined,
      ),
    )
    .orderBy(desc(aidContribution.submittedAt));

  const contributions = lines.map((line) => ({
    id: line.id,
    contributionId: line.contributionId,
    // The receipt date is the truth once a camp confirms; before that the
    // planned delivery date is the best answer, and the submission date last.
    date: (line.date ?? line.plannedDate ?? line.submittedAt)?.toISOString() ?? null,
    aidTypeName: line.aidTypeName,
    campName: line.campName,
    quantity: line.actualQuantity ?? line.plannedQuantity,
    unit: line.unit,
    status: line.status,
  }));

  // Camps coverage: one row per camp this provider has reached, counting only
  // the batches a Camp Manager actually confirmed as arrived.
  const coverage = [
    ...lines
      .reduce((acc, line) => {
        const entry = acc.get(line.campId) ?? {
          id: line.campId,
          name: line.campName,
          location: line.campLocation as string,
          status: line.campStatus as string,
          totalAidBatches: 0,
        };
        if (ARRIVED.has(line.status)) entry.totalAidBatches += 1;
        acc.set(line.campId, entry);
        return acc;
      }, new Map<string, { id: string; name: string; location: string; status: string; totalAidBatches: number }>())
      .values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ProviderDetails
      provider={formattedProvider}
      contributions={contributions}
      campsCoverage={coverage}
    />
  );
}
