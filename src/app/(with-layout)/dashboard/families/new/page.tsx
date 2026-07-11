import { db } from "@/db";
import { camp, campAssignment } from "@/db/schema";
import NewFamilyForm from "@/components/Families/NewFamilyForm";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewFamilyPage() {
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

  let campsList: any[] = [];

  if (isManager) {
    // Get camps assigned to this manager
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
    // Admin gets all active camps
    campsList = await db
      .select({
        id: camp.id,
        name: camp.name,
      })
      .from(camp)
      .where(eq(camp.status, "active"));
  }

  return <NewFamilyForm camps={campsList} />;
}
