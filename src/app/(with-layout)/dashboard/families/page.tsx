import { db } from "@/db";
import { family, camp } from "@/db/schema";
import FamiliesList from "@/components/Families/FamiliesList";
import { guardPage } from "@/lib/auth/guard";
import { and, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function FamiliesDashboardPage() {
  const { campIds } = await guardPage("family", "read", { records: true });

  const familiesData =
    campIds !== null && campIds.length === 0
      ? []
      : await db
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
            campIds === null
              ? eq(family.status, "active")
              : and(
                  eq(family.status, "active"),
                  inArray(family.campId, campIds),
                ),
          )
          .orderBy(family.createdAt);

  return (
    <FamiliesList initialFamilies={familiesData} isManagerOrAdmin={true} />
  );
}
