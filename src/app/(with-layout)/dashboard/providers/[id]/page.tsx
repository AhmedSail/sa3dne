import { db } from "@/db";
import { aidProvider, user } from "@/db/schema";
import ProviderDetails from "@/components/Providers/ProviderDetails";
import { can, guardPage } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProviderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { actor } = await guardPage("provider", "read");

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

  return <ProviderDetails provider={formattedProvider} />;
}
