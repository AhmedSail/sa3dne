import { db } from "@/db";
import { aidProvider, user } from "@/db/schema";
import ProvidersList from "@/components/Providers/ProvidersList";
import { can, guardPage } from "@/lib/auth/guard";
import { and, eq, or, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProvidersDashboardPage() {
  const { actor } = await guardPage("provider", "read");

  const isAdmin = can(actor.role, "provider", "update");
  const activeProviders = await db
    .select()
    .from(aidProvider)
    .where(eq(aidProvider.status, "active"))
    .orderBy(aidProvider.createdAt);

  // Accounts eligible for provider linking. This is user data, so it is only
  // queried for a role that may actually administer the provider directory.
  const linkableUsers = isAdmin
    ? await db
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
        )
    : [];

  return (
    <ProvidersList
      initialProviders={activeProviders}
      users={linkableUsers}
      isAdmin={isAdmin}
    />
  );
}
