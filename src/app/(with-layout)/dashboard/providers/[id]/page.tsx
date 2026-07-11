import { db } from "@/db";
import { aidProvider, user } from "@/db/schema";
import ProviderDetails from "@/components/Providers/ProviderDetails";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProviderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

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

  const formattedProvider = {
    ...providerData[0].provider,
    linkedUserName: providerData[0].userName,
    linkedUserEmail: providerData[0].userEmail,
  };

  return <ProviderDetails provider={formattedProvider} />;
}
