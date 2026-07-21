import { auth } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications/service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import NotificationsClient from "./_components/NotificationsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الإشعارات",
};

export default async function NotificationsPage() {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  const notifications = await listNotifications(session.user.id, { limit: 100 });

  return <NotificationsClient initialNotifications={notifications} />;
}
