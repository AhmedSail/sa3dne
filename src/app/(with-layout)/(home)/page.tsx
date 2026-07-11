import { getDashboardStats } from "./fetch";
import DashboardClient from "./_components/DashboardClient";

export default async function Home() {
  const stats = await getDashboardStats();

  return (
    <>
      <DashboardClient data={stats} />
    </>
  );
}
