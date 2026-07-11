import { db } from "@/db";
import { camp } from "@/db/schema";
import CampsList from "@/components/Camps/CampsList";
import { auth } from "@/lib/auth";
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
  const allCamps = await db.select().from(camp).orderBy(camp.createdAt);

  return <CampsList initialCamps={allCamps} isAdmin={isAdmin} />;
}
