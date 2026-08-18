import { db } from "@/db";
import { aidType } from "@/db/schema";
import AidTypesList from "@/components/AidTypes/AidTypesList";
import { can, guardPage } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AidTypesDashboardPage() {
  const { actor } = await guardPage("aidType", "read");

  const isAdmin = can(actor.role, "aidType", "update");
  const activeTypes = await db
    .select()
    .from(aidType)
    .where(eq(aidType.status, "active"))
    .orderBy(aidType.createdAt);

  return <AidTypesList initialTypes={activeTypes} isAdmin={isAdmin} />;
}
