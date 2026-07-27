import NewUserForm from "@/components/Users/NewUserForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { camp } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const camps = await db.select({ id: camp.id, name: camp.name }).from(camp);

  return <NewUserForm camps={camps} />;
}
