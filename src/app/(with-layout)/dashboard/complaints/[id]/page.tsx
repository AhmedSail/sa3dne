import { db } from "@/db";
import { complaints } from "@/db/schema/complaints";
import { campAssignment, camp } from "@/db/schema/camps";
import { auth } from "@/lib/auth/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import ComplaintDetailsClient from "./_components/ComplaintDetailsClient";

export const metadata: Metadata = {
  title: "تفاصيل الطلب",
};

export default async function ComplaintDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "camp_manager") {
    redirect("/dashboard");
  }

  const result = await db
    .select({
      complaint: complaints,
      campName: camp.name,
    })
    .from(complaints)
    .innerJoin(camp, eq(complaints.campId, camp.id))
    .where(eq(complaints.id, resolvedParams.id))
    .limit(1);

  if (result.length === 0) {
    notFound();
  }

  const data = result[0];

  if (role === "camp_manager") {
    const assignments = await db.query.campAssignment.findMany({
      where: eq(campAssignment.userId, session.user.id),
    });
    const campIds = assignments.map((a) => a.campId);
    if (!campIds.includes(data.complaint.campId)) {
      redirect("/dashboard/complaints");
    }
  }

  return <ComplaintDetailsClient data={data} />;
}
