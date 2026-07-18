import FeedbackForm from "@/components/Feedback/FeedbackForm";
import { db } from "@/db";
import { camp } from "@/db/schema/camps";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تقديم شكوى أو مقترح",
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const campsList = await db.query.camp.findMany({
    where: eq(camp.status, "active"),
    columns: {
      id: true,
      name: true,
    },
    orderBy: (camps, { asc }) => [asc(camps.name)],
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-10">
      <FeedbackForm camps={campsList} />
    </div>
  );
}
