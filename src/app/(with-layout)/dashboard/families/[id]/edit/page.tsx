import { db } from "@/db";
import { family, camp, campAssignment, familyMember } from "@/db/schema";
import EditFamilyForm from "@/components/Families/EditFamilyForm";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditFamilyPage({
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

  const role = session.user.role;
  const isManager = role === "camp_manager";
  const isAdmin = role === "admin";

  if (!isAdmin && !isManager) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const familyData = await db.select().from(family).where(eq(family.id, id)).limit(1);

  if (familyData.length === 0) {
    notFound();
  }

  // If camp manager, verify this family's camp is assigned to them
  if (isManager) {
    const assignment = await db
      .select()
      .from(campAssignment)
      .where(
        and(
          eq(campAssignment.campId, familyData[0].campId),
          eq(campAssignment.userId, session.user.id)
        )
      )
      .limit(1);

    if (assignment.length === 0) {
      redirect("/dashboard/families");
    }
  }

  // Fetch target camps
  let campsList: any[] = [];
  if (isManager) {
    campsList = await db
      .select({
        id: camp.id,
        name: camp.name,
      })
      .from(campAssignment)
      .innerJoin(camp, eq(campAssignment.campId, camp.id))
      .where(
        and(
          eq(campAssignment.userId, session.user.id),
          eq(camp.status, "active")
        )
      );
  } else {
    campsList = await db
      .select({
        id: camp.id,
        name: camp.name,
      })
      .from(camp)
      .where(eq(camp.status, "active"));
  }

  // Fetch family members
  const membersList = await db
    .select()
    .from(familyMember)
    .where(eq(familyMember.familyId, id));

  const formattedFamily = {
    id: familyData[0].id,
    campId: familyData[0].campId,
    headName: familyData[0].headName,
    nationalId: familyData[0].nationalId,
    phone: familyData[0].phone,
    memberCount: familyData[0].memberCount,
    occupation: familyData[0].occupation,
    notes: familyData[0].notes,
    members: membersList,
  };

  return <EditFamilyForm family={formattedFamily} camps={campsList} />;
}
