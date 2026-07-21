import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCampManagerStats } from "../../(home)/fetch";
import CampManagerClient from "./_components/CampManagerClient";

export const dynamic = "force-dynamic";

export default async function CampManagerDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  if (role !== "camp_manager" && role !== "admin") redirect("/");

  const stats = await getCampManagerStats(session.user.id);

  return <CampManagerClient data={stats} />;
}
