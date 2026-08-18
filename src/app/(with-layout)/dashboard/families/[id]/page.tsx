import { db } from "@/db";
import { family, familyMember, camp } from "@/db/schema";
import FamilyDetails from "@/components/Families/FamilyDetails";
import { guardPage, isWithinCampScope } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FamilyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { campIds } = await guardPage("family", "read", { records: true });

  const { id } = await params;

  const familyData = await db
    .select({
      family: family,
      campName: camp.name,
      campLocation: camp.location,
    })
    .from(family)
    .leftJoin(camp, eq(family.campId, camp.id))
    .where(eq(family.id, id))
    .limit(1);

  if (familyData.length === 0) {
    notFound();
  }

  // A family outside the actor's camp scope is indistinguishable from one that
  // does not exist, so nothing about it leaks.
  if (!isWithinCampScope(campIds, familyData[0].family.campId)) {
    notFound();
  }

  // Fetch family members
  const members = await db
    .select()
    .from(familyMember)
    .where(eq(familyMember.familyId, id));

  const formattedFamily = {
    ...familyData[0].family,
    campName: familyData[0].campName || "N/A",
    campLocation: familyData[0].campLocation || "N/A",
    members: members,
  };

  return <FamilyDetails family={formattedFamily} />;
}
