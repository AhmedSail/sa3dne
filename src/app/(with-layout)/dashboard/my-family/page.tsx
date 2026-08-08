import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { family } from "@/db/schema/families";
import { camp } from "@/db/schema/camps";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MyFamilyClient from "./_components/MyFamilyClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "عائلتي | ساعدني",
};

export const dynamic = "force-dynamic";

export default async function MyFamilyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  if (role !== "beneficiary") redirect("/dashboard");

  // Extract ID from email (strip @sa3dne.local suffix)
  const nationalId = session.user.email?.replace("@sa3dne.local", "") ?? "";

  // Look up family by nationalId
  const familyData = await db
    .select({
      id: family.id,
      headName: family.headName,
      nationalId: family.nationalId,
      phone: family.phone,
      memberCount: family.memberCount,
      occupation: family.occupation,
      notes: family.notes,
      status: family.status,
      campId: family.campId,
      campName: camp.name,
      campLocation: camp.location,
    })
    .from(family)
    .leftJoin(camp, eq(family.campId, camp.id))
    .where(eq(family.nationalId, nationalId))
    .limit(1);

  const camps = await db
    .select({ id: camp.id, name: camp.name, location: camp.location })
    .from(camp);

  let members: any[] = [];
  let requests: any[] = [];
  if (familyData[0]) {
    const { familyMember } = await import("@/db/schema/families");
    const { familyUpdateRequest } = await import("@/db/schema/family_requests");
    const { desc } = await import("drizzle-orm");

    members = await db
      .select()
      .from(familyMember)
      .where(eq(familyMember.familyId, familyData[0].id))
      .orderBy(familyMember.createdAt);
      
    requests = await db
      .select()
      .from(familyUpdateRequest)
      .where(eq(familyUpdateRequest.familyId, familyData[0].id))
      .orderBy(desc(familyUpdateRequest.createdAt));
  }

  return (
    <MyFamilyClient
      nationalId={nationalId}
      familyData={familyData[0] ?? null}
      camps={camps}
      members={members}
      requests={requests}
    />
  );
}
