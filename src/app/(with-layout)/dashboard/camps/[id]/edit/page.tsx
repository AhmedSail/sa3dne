import { db } from "@/db";
import { camp, campAssignment, user } from "@/db/schema";
import EditCampForm from "@/components/Camps/EditCampForm";
import { auth } from "@/lib/auth";
import { and, eq, or, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCampPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const campData = await db.select().from(camp).where(eq(camp.id, id)).limit(1);

  if (campData.length === 0) {
    notFound();
  }

  // Fetch current assignments for this camp
  const currentAssignments = await db
    .select({
      userId: campAssignment.userId,
    })
    .from(campAssignment)
    .where(eq(campAssignment.campId, id));

  const assignedUserIds = currentAssignments.map((a) => a.userId);

  // Fetch all active camp managers
  const managers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(
      and(
        eq(user.role, "camp_manager"),
        or(eq(user.banned, false), isNull(user.banned))
      )
    );

  const formattedCamp = {
    id: campData[0].id,
    name: campData[0].name,
    location: campData[0].location,
    capacity: campData[0].capacity,
    operationalStatus: campData[0].operationalStatus,
    needLevel: campData[0].needLevel,
    notes: campData[0].notes,
    status: campData[0].status,
    assignedManagers: assignedUserIds,
  };

  return <EditCampForm camp={formattedCamp} managers={managers} />;
}
