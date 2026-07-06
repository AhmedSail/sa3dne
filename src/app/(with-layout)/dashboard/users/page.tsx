import { db } from "@/db";
import { user } from "@/db/schema";
import UsersList from "@/components/Users/UsersList";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await db.select().from(user).orderBy(user.createdAt);

  return <UsersList initialUsers={users} currentUserId={session.user.id} />;
}
