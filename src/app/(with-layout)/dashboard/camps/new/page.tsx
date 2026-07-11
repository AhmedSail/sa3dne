import { db } from "@/db";
import { user } from "@/db/schema";
import NewCampForm from "@/components/Camps/NewCampForm";
import { auth } from "@/lib/auth";
import { and, eq, or, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewCampPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as any;

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch active camp managers
  const managers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(
      and(
        eq(user.role, "camp_manager"),
        or(eq(user.banned, false), isNull(user.banned))
      )
    );

  return <NewCampForm managers={managers} />;
}
