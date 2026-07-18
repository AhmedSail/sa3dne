import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProviderStats } from "../../(home)/fetch";
import ProviderClient from "./_components/ProviderClient";

export const dynamic = "force-dynamic";

export default async function ProviderDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  if (role !== "org_representative" && role !== "independent_initiator" && role !== "admin") {
    redirect("/");
  }

  const stats = await getProviderStats(session.user.id);

  return <ProviderClient data={stats} />;
}
