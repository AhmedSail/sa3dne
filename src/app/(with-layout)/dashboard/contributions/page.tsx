import { db } from "@/db";
import { aidContribution, aidProvider } from "@/db/schema";
import ContributionsList from "@/components/Contributions/ContributionsList";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContributionsPage() {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  const isAdmin = session.user.role === "admin";

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
    const provider = await getActiveProviderForUser(session.user.id);
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
