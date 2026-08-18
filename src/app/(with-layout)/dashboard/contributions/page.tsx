import { db } from "@/db";
import { aidContribution, aidProvider } from "@/db/schema";
import ContributionsList from "@/components/Contributions/ContributionsList";
import { can, guardPage } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { desc, eq } from "drizzle-orm";
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

  return (
    <ContributionsList
      contributions={rows}
      canCreate={canCreate}
      showProvider={isAdmin}
      titleKey="contributionsList"
    />
  );
}
