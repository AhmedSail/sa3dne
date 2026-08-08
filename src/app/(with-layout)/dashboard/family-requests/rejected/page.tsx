import { db } from "@/db";
import { familyUpdateRequest } from "@/db/schema/family_requests";
import { family } from "@/db/schema/families";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import RejectedRequestsClient from "./_components/RejectedRequestsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلبات العائلات المرفوضة | ساعدني",
};

export const dynamic = "force-dynamic";

export default async function RejectedRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const requests = await db
    .select({
      id: familyUpdateRequest.id,
      familyId: familyUpdateRequest.familyId,
      type: familyUpdateRequest.type,
      payload: familyUpdateRequest.payload,
      status: familyUpdateRequest.status,
      createdAt: familyUpdateRequest.createdAt,
      reviewedAt: familyUpdateRequest.reviewedAt,
      rejectionReason: familyUpdateRequest.rejectionReason,
      familyHeadName: family.headName,
      familyNationalId: family.nationalId,
      campId: family.campId,
    })
    .from(familyUpdateRequest)
    .innerJoin(family, eq(familyUpdateRequest.familyId, family.id))
    .where(eq(familyUpdateRequest.status, "rejected"))
    .orderBy(desc(familyUpdateRequest.reviewedAt));

  return <RejectedRequestsClient requests={requests} />;
}
