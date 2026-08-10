import { db } from "@/db";
import { camp, campAssignment, user } from "@/db/schema";
import CampDetails from "@/components/Camps/CampDetails";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  // Server-side scope: a Camp Manager may only open a camp they are assigned to.
  if (session.user.role === "camp_manager") {
    const assigned = await getAssignedCampIds(session.user.id);
    if (!assigned.includes(id)) {
      redirect("/dashboard/camps");
    }
  }

  const campData = await db.select().from(camp).where(eq(camp.id, id)).limit(1);

  if (campData.length === 0) {
    notFound();
  }

  // Fetch assigned managers
  const assignments = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(campAssignment)
    .innerJoin(user, eq(campAssignment.userId, user.id))
    .where(eq(campAssignment.campId, id));

  const formattedCamp = {
    id: campData[0].id,
    name: campData[0].name,
    location: campData[0].location,
    capacity: campData[0].capacity,
    operationalStatus: campData[0].operationalStatus,
    needLevel: campData[0].needLevel,
    notes: campData[0].notes,
    status: campData[0].status,
    assignedManagers: assignments,
  };

  return <CampDetails camp={formattedCamp} />;
}
