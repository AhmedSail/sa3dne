import { db } from "@/db";
import { camp, campAssignment, family, user } from "@/db/schema";
import CampDetails from "@/components/Camps/CampDetails";
import { can, guardPage, isWithinCampScope } from "@/lib/auth/guard";
import { and, eq, sql } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { actor, campIds } = await guardPage("camp", "read");

  const { id } = await params;

  // Server-side scope: a Camp Manager may only open a camp they are assigned to.
  if (!isWithinCampScope(campIds, id)) {
    redirect("/dashboard/camps");
  }

  const campData = await db.select().from(camp).where(eq(camp.id, id)).limit(1);

  if (campData.length === 0) {
    notFound();
  }

  // Manager names and e-mail addresses are account data, so they are only
  // fetched for a role that may read user records.
  const assignments = can(actor.role, "user", "read")
    ? await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(campAssignment)
        .innerJoin(user, eq(campAssignment.userId, user.id))
        .where(eq(campAssignment.campId, id))
    : [];

  // Registered population of the camp. Capacity is counted in families, so the
  // family count is what compares against it; individuals come from the same
  // active families.
  const registration = await db
    .select({
      families: sql<number>`count(*)`.mapWith(Number),
      individuals: sql<number>`coalesce(sum(${family.memberCount}), 0)`.mapWith(
        Number,
      ),
    })
    .from(family)
    .where(and(eq(family.campId, id), eq(family.status, "active")));

  const formattedCamp = {
    id: campData[0].id,
    name: campData[0].name,
    location: campData[0].location,
    capacity: campData[0].capacity,
    registeredFamilies: registration[0]?.families ?? 0,
    registeredIndividuals: registration[0]?.individuals ?? 0,
    operationalStatus: campData[0].operationalStatus,
    needLevel: campData[0].needLevel,
    notes: campData[0].notes,
    status: campData[0].status,
    assignedManagers: assignments,
  };

  return <CampDetails camp={formattedCamp} />;
}
