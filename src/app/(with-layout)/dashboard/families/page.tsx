import { db } from "@/db";
import { family, camp, campAssignment } from "@/db/schema";
import FamiliesList from "@/components/Families/FamiliesList";
import { auth } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FamiliesDashboardPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session) {
    redirect("/auth/sign-in");
  }

  const role = session.user.role;
  const isManager = role === "camp_manager";
  const isAdmin = role === "admin";

  if (!isAdmin && !isManager) {
    redirect("/dashboard");
  }

  let familiesData: any[] = [];

  if (isManager) {
    // Get camps assigned to this manager
    const assignedCamps = await db
      .select({ campId: campAssignment.campId })
      .from(campAssignment)
      .where(eq(campAssignment.userId, session.user.id));
    const campIds = assignedCamps.map((c) => c.campId);

    if (campIds.length > 0) {
      familiesData = await db
        .select({
          id: family.id,
          headName: family.headName,
          nationalId: family.nationalId,
          phone: family.phone,
          memberCount: family.memberCount,
          campName: camp.name,
          campId: family.campId,
          campLocation: camp.location,
          occupation: family.occupation,
          status: family.status,
        })
        .from(family)
        .innerJoin(camp, eq(family.campId, camp.id))
        .where(
          and(
            eq(family.status, "active"),
            inArray(family.campId, campIds)
          )
        )
        .orderBy(family.createdAt);
    }
  } else {
    // Admin fetches all active families
    familiesData = await db
      .select({
        id: family.id,
        headName: family.headName,
        nationalId: family.nationalId,
        phone: family.phone,
        memberCount: family.memberCount,
        campName: camp.name,
        campId: family.campId,
        campLocation: camp.location,
        occupation: family.occupation,
        status: family.status,
      })
      .from(family)
      .innerJoin(camp, eq(family.campId, camp.id))
      .where(eq(family.status, "active"))
      .orderBy(family.createdAt);
  }

  return (
    <FamiliesList
      initialFamilies={familiesData}
      isManagerOrAdmin={isAdmin || isManager}
    />
  );
}
