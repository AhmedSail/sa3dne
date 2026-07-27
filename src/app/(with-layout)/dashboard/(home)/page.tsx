import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardStats } from "./fetch";
import DashboardClient from "./_components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const stats = await getDashboardStats(session.user.id, (session.user as any).role);

  return (
    <>
      <DashboardClient data={stats} userRole={(session.user as any).role} />
    </>
  );
}
