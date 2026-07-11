import { db } from "@/db";
import { aidType } from "@/db/schema";
import AidTypesList from "@/components/AidTypes/AidTypesList";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AidTypesDashboardPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session) {
    redirect("/auth/sign-in");
  }

  const isAdmin = session.user.role === "admin";
  const activeTypes = await db
    .select()
    .from(aidType)
    .where(eq(aidType.status, "active"))
    .orderBy(aidType.createdAt);

  return <AidTypesList initialTypes={activeTypes} isAdmin={isAdmin} />;
}
