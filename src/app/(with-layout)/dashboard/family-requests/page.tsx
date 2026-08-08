import { db } from "@/db";
import { familyUpdateRequest } from "@/db/schema/family_requests";
import { family } from "@/db/schema/families";
import { campAssignment } from "@/db/schema/camps";
import { eq, desc, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FamilyRequestsClient from "./_components/FamilyRequestsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلبات تحديث العائلات | ساعدني",
};

export const dynamic = "force-dynamic";

export default async function FamilyRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  if (role !== "camp_manager" && role !== "admin") {
    redirect("/dashboard");
  }

  let requestsQuery = db
    .select({
      id: familyUpdateRequest.id,
      familyId: familyUpdateRequest.familyId,
      type: familyUpdateRequest.type,
      payload: familyUpdateRequest.payload,
      status: familyUpdateRequest.status,
      createdAt: familyUpdateRequest.createdAt,
      familyHeadName: family.headName,
      familyNationalId: family.nationalId,
      campId: family.campId,
    })
    .from(familyUpdateRequest)
    .innerJoin(family, eq(familyUpdateRequest.familyId, family.id))
    .where(eq(familyUpdateRequest.status, "pending"))
    .orderBy(desc(familyUpdateRequest.createdAt))
    .$dynamic();

  // If camp manager, filter by their assigned camps
  if (role === "camp_manager") {
    const assignments = await db
      .select({ campId: campAssignment.campId })
      .from(campAssignment)
      .where(eq(campAssignment.userId, session.user.id));
      
    const campIds = assignments.map(a => a.campId);
    
    if (campIds.length === 0) {
      // Manager has no camps, show nothing
      return <FamilyRequestsClient requests={[]} />;
    }
    
    requestsQuery = requestsQuery.where(
      and(
        eq(familyUpdateRequest.status, "pending"),
        inArray(family.campId, campIds)
      )
    );
  }

  const requests = await requestsQuery;

  return <FamilyRequestsClient requests={requests} />;
}
