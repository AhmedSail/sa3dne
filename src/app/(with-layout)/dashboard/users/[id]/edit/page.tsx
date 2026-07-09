import EditUserForm from "@/components/Users/EditUserForm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const userData = await db.select().from(user).where(eq(user.id, id)).limit(1);

  if (userData.length === 0) {
    notFound();
  }

  // Map nulls and format for the client component
  const formattedUser = {
    id: userData[0].id,
    name: userData[0].name,
    email: userData[0].email,
    role: userData[0].role,
    phone: userData[0].phone,
  };

  return <EditUserForm user={formattedUser} />;
}
