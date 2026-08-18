import { guardPage } from "@/lib/auth/guard";
import { db } from "@/db";
import { complaints } from "@/db/schema/complaints";
import { family } from "@/db/schema/families";
import { camp } from "@/db/schema/camps";
import { eq, desc } from "drizzle-orm";
import MyComplaintsClient from "./_components/MyComplaintsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "شكاواي | ساعدني",
};

export const dynamic = "force-dynamic";

export default async function MyComplaintsPage() {
  const { actor } = await guardPage("family", "manage_own");

  // The household is joined to the account by `family.user_id`.
  const familyData = await db
    .select({ id: family.id, campId: family.campId, headName: family.headName })
    .from(family)
    .where(eq(family.userId, actor.id))
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
