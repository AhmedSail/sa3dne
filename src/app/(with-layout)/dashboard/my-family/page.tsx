import { guardPage } from "@/lib/auth/guard";
import { ownNationalId } from "@/lib/families/access";
import { db } from "@/db";
import { family } from "@/db/schema/families";
import { camp } from "@/db/schema/camps";
import { eq } from "drizzle-orm";
import MyFamilyClient from "./_components/MyFamilyClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "عائلتي | ساعدني",
};

export const dynamic = "force-dynamic";

export default async function MyFamilyPage() {
  const { actor } = await guardPage("family", "manage_own");

  // The household is identified by the acting account, not by a route or form
  // value, so this page can only ever show the visitor their own record.
  const nationalId = ownNationalId(actor);

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
