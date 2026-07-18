import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { camp, family } from "@/db/schema";
import { campAssignment } from "@/db/schema/camps";
import { eq, sql } from "drizzle-orm";
import CampNeedsClient from "./_components/CampNeedsClient";

export const dynamic = "force-dynamic";

export default async function CampNeedsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  
  // Only admin, camp_manager, and org_rep/independent can view needs
  if (!["admin", "camp_manager", "org_representative", "independent_initiator"].includes(role)) {
    redirect("/");
  }

  // Fetch camps and family counts
  let campsList = await db.select().from(camp);
  const familiesList = await db.select().from(family);

  // Filter for camp manager if needed
  if (role === "camp_manager") {
    const assignments = await db.select().from(campAssignment).where(eq(campAssignment.userId, session.user.id));
    const assignedIds = assignments.map(a => a.campId);
    campsList = campsList.filter(c => assignedIds.includes(c.id));
  }

  // Map family count
  const campsWithStats = campsList.map(c => ({
    id: c.id,
    name: c.name,
    location: c.location,
    capacity: c.capacity,
    needLevel: c.needLevel,
    operationalStatus: c.operationalStatus,
    familiesCount: familiesList.filter(f => f.campId === c.id).length,
  }));

  // Providers only see the data, they cannot edit it. Admin/Camp Manager can edit.
  const canEdit = ["admin", "camp_manager"].includes(role);

  return <CampNeedsClient data={campsWithStats} canEdit={canEdit} />;
}
