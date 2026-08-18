import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  camp,
} from "@/db/schema";
import ContributionsList from "@/components/Contributions/ContributionsList";
import { guardPage } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { deriveDisplayStatus, isCancellable } from "@/lib/contributions/status";
import { desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MyContributionsPage() {
  const { actor } = await guardPage("contribution", "read");

  const provider = await getActiveProviderForUser(actor.id);

  if (!provider) {
    return (
      <ContributionsList
        contributions={[]}
        camps={[]}
        canCreate={false}
        showProvider={false}
        titleKey="myContributions"
      />
    );
  }

  const headers = await db
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
    .where(eq(aidContribution.providerId, provider.id))
    .orderBy(desc(aidContribution.createdAt));

  // The header status only tracks draft/submitted/cancelled; what the provider
  // needs to see is what each camp did with the aid, which lives on the lines.
  const lines = headers.length
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
            headers.map((h) => h.id),
          ),
        )
    : [];

  const contributions = headers.map((header) => {
    const own = lines.filter((l) => l.contributionId === header.id);
    const statuses = own.map((l) => l.status);

    return {
      ...header,
      displayStatus: deriveDisplayStatus(header.status, statuses),
      cancellable: isCancellable(header.status, statuses),
      camps: [...new Map(own.map((l) => [l.campId, l.campName])).entries()].map(
        ([id, name]) => ({ id, name }),
      ),
    };
  });

  // Only the camps this provider has actually sent to are worth filtering by.
  const camps = [...new Map(lines.map((l) => [l.campId, l.campName])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ContributionsList
      contributions={contributions}
      camps={camps}
      canCreate
      showProvider={false}
      titleKey="myContributions"
    />
  );
}
