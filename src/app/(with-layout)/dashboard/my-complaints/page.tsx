import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { complaints } from "@/db/schema/complaints";
import { family } from "@/db/schema/families";
import { camp } from "@/db/schema/camps";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MyComplaintsClient from "./_components/MyComplaintsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "شكاواي | ساعدني",
};

export const dynamic = "force-dynamic";

export default async function MyComplaintsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const role = (session.user as any).role;
  if (role !== "beneficiary") redirect("/dashboard");

  const nationalId = session.user.email?.replace("@sa3dne.local", "") ?? "";

  // Get the family to find the campId
  const familyData = await db
    .select({ id: family.id, campId: family.campId, headName: family.headName })
    .from(family)
    .where(eq(family.nationalId, nationalId))
    .limit(1);

  const myFamily = familyData[0] ?? null;

  // Get complaints for this beneficiary's camp filtered by their name
  let myComplaints: any[] = [];
  if (myFamily) {
    myComplaints = await db
      .select({
        id: complaints.id,
        trackingNumber: complaints.trackingNumber,
        type: complaints.type,
        details: complaints.details,
        status: complaints.status,
        resolutionNotes: complaints.resolutionNotes,
        rejectionReason: complaints.rejectionReason,
        createdAt: complaints.createdAt,
        campName: camp.name,
      })
      .from(complaints)
      .leftJoin(camp, eq(complaints.campId, camp.id))
      .where(eq(complaints.campId, myFamily.campId))
      .orderBy(desc(complaints.createdAt));
  }

  const camps = await db
    .select({ id: camp.id, name: camp.name, location: camp.location })
    .from(camp);

  return (
    <MyComplaintsClient
      myComplaints={myComplaints}
      camps={camps}
      defaultCampId={myFamily?.campId ?? ""}
      defaultName={myFamily?.headName ?? ""}
    />
  );
}
