import { db } from "@/db";
import { aidContribution, aidProvider } from "@/db/schema";
import ContributionsList from "@/components/Contributions/ContributionsList";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MyContributionsPage() {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  const provider = await getActiveProviderForUser(session.user.id);

  const rows = provider
    ? await db
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
        .orderBy(desc(aidContribution.createdAt))
    : [];

  return (
    <ContributionsList
      contributions={rows}
      canCreate={!!provider}
      showProvider={false}
      titleKey="myContributions"
    />
  );
}
