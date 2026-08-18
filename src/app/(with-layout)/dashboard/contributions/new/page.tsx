import { db } from "@/db";
import { camp, aidType } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import NewContribution from "@/components/Contributions/NewContribution";
import { guardPage } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewContributionPage() {
  const { actor } = await guardPage("contribution", "read");

  // Only a user with an active provider profile may create a contribution.
  const provider = await getActiveProviderForUser(actor.id);
  if (!provider) {
    redirect("/dashboard/contributions");
  }

  const camps = await db
    .select({ id: camp.id, name: camp.name })
    .from(camp)
    .where(and(eq(camp.status, "active"), ne(camp.operationalStatus, "closed")))
    .orderBy(camp.name);

  const aidTypes = await db
    .select({ id: aidType.id, name: aidType.name, defaultUnit: aidType.defaultUnit })
    .from(aidType)
    .where(eq(aidType.status, "active"))
    .orderBy(aidType.name);

  return <NewContribution providerName={provider.name} camps={camps} aidTypes={aidTypes} />;
}
