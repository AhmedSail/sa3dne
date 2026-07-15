import NewContribution from "@/components/Contributions/NewContribution";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewContributionPage() {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Only a user with an active provider profile may create a contribution.
  const provider = await getActiveProviderForUser(session.user.id);
  if (!provider) {
    redirect("/dashboard/contributions");
  }

  return <NewContribution providerName={provider.name} />;
}
