import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  camp,
} from "@/db/schema";
import ContributionsList from "@/components/Contributions/ContributionsList";
import { can, guardPage } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { deriveDisplayStatus, isCancellable } from "@/lib/contributions/status";
import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContributionsPage() {
  const { actor } = await guardPage("contribution", "read");

  // The contributions register belongs to admins and providers. A Camp Manager
  // works from "Incoming Aid", which is scoped to their assigned camps.
  const isCampSide = can(actor.role, "contribution", "receive");
  if (isCampSide && !can(actor.role, "provider", "update")) {
    redirect("/dashboard/incoming-aid");
  }

  const isAdmin = can(actor.role, "provider", "update");

  const baseQuery = db
    .select({
      id: aidContribution.id,
      providerId: aidContribution.providerId,
      providerName: aidProvider.name,
      status: aidContribution.status,
      notes: aidContribution.notes,
      submittedAt: aidContribution.submittedAt,
      createdAt: aidContribution.createdAt,
    })
    .from(aidContribution)
    .innerJoin(aidProvider, eq(aidContribution.providerId, aidProvider.id))
    .orderBy(desc(aidContribution.createdAt));

  let rows: Awaited<typeof baseQuery> = [];
  let canCreate = false;

  if (isAdmin) {
    rows = await baseQuery;
  } else {
    const provider = await getActiveProviderForUser(actor.id);
    if (provider) {
      canCreate = true;
      rows = (await baseQuery).filter((r) => r.providerId === provider.id);
    }
  }

  // The header status alone would show every submitted contribution as
  // "submitted" forever; the receiving camps' line statuses are what tell the
  // real story, so they are folded into one display status per row.
  const lines = rows.length
    ? await db
        .select({
          contributionId: aidContributionLine.contributionId,
          campId: aidContributionLine.campId,
          campName: camp.name,
          status: aidContributionLine.status,
        })
        .from(aidContributionLine)
        .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
        .where(
          inArray(
            aidContributionLine.contributionId,
            rows.map((r) => r.id),
          ),
        )
    : [];

  const contributions = rows.map((row) => {
    const own = lines.filter((l) => l.contributionId === row.id);
    const statuses = own.map((l) => l.status);

    return {
      ...row,
      displayStatus: deriveDisplayStatus(row.status, statuses),
      // Only the owning provider withdraws a contribution, never the overseer.
      cancellable: !isAdmin && isCancellable(row.status, statuses),
      camps: [...new Map(own.map((l) => [l.campId, l.campName])).entries()].map(
        ([id, name]) => ({ id, name }),
      ),
    };
  });

  const camps = [...new Map(lines.map((l) => [l.campId, l.campName])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ContributionsList
      contributions={contributions}
      camps={camps}
      canCreate={canCreate}
      showProvider={isAdmin}
      titleKey="contributionsList"
    />
  );
}
