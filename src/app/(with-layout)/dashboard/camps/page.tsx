import { db } from "@/db";
import { camp, family } from "@/db/schema";
import CampsList from "@/components/Camps/CampsList";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampsDashboardPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session) {
    redirect("/auth/sign-in");
  }

  const isAdmin = session.user.role === "admin";
  const isCampManager = session.user.role === "camp_manager";

  // Server-side scope: a Camp Manager only ever sees the camps they are
  // responsible for. Everyone else with access to this page sees all camps.
  let assignedCampIds: string[] = [];
  if (isCampManager) {
    assignedCampIds = await getAssignedCampIds(session.user.id);
  }

  const camps =
    isCampManager && assignedCampIds.length === 0
      ? []
      : await db
          .select()
          .from(camp)
          .where(isCampManager ? inArray(camp.id, assignedCampIds) : undefined)
          .orderBy(camp.createdAt);

  // Registered population per camp. Capacity is expressed in families, so the
  // family count is what compares against it; individuals are shown alongside
  // it for population reporting.
  const registrationRows =
    camps.length === 0
      ? []
      : await db
          .select({
            campId: family.campId,
            families: sql<number>`count(*)`.mapWith(Number),
            individuals:
              sql<number>`coalesce(sum(${family.memberCount}), 0)`.mapWith(
                Number,
              ),
          })
          .from(family)
          .where(
            and(
              eq(family.status, "active"),
              inArray(
                family.campId,
                camps.map((c) => c.id),
              ),
            ),
          )
          .groupBy(family.campId);

  const registrationByCamp = new Map(
    registrationRows.map((r) => [r.campId, r]),
  );

  const campsWithRegistration = camps.map((c) => ({
    ...c,
    registeredFamilies: registrationByCamp.get(c.id)?.families ?? 0,
    registeredIndividuals: registrationByCamp.get(c.id)?.individuals ?? 0,
  }));

  return (
    <CampsList
      initialCamps={campsWithRegistration}
      isAdmin={isAdmin}
      unassigned={isCampManager && assignedCampIds.length === 0}
    />
  );
}
