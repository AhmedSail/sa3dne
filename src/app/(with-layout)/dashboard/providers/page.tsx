import { db } from "@/db";
import { aidProvider, user } from "@/db/schema";
import ProvidersList from "@/components/Providers/ProvidersList";
import { auth } from "@/lib/auth";
import { and, eq, or, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProvidersDashboardPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session) {
    redirect("/auth/sign-in");
  }

  const isAdmin = session.user.role === "admin";
  const activeProviders = await db
    .select()
    .from(aidProvider)
    .where(eq(aidProvider.status, "active"))
    .orderBy(aidProvider.createdAt);

  // Fetch active users eligible for provider linking
  const linkableUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(
      and(
        or(
          eq(user.role, "org_representative"),
          eq(user.role, "independent_initiator"),
          eq(user.role, "admin")
        ),
        or(eq(user.banned, false), isNull(user.banned))
      )
    );

  return (
    <ProvidersList
      initialProviders={activeProviders}
      users={linkableUsers}
      isAdmin={isAdmin}
    />
  );
}
