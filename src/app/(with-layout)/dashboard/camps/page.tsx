import { db } from "@/db";
import { camp } from "@/db/schema";
import CampsList from "@/components/Camps/CampsList";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { inArray } from "drizzle-orm";
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

  return (
    <CampsList
      initialCamps={camps}
      isAdmin={isAdmin}
      unassigned={isCampManager && assignedCampIds.length === 0}
    />
  );
}
