import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import ReceiptConfirmation from "@/components/IncomingAid/ReceiptConfirmation";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReceiptConfirmationPage({
  params,
}: {
  params: Promise<{ lineId: string }>;
}) {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  const role = session.user.role;
  const isAdmin = role === "admin";
  const isCampManager = role === "camp_manager";
  if (!isAdmin && !isCampManager) {
    redirect("/dashboard");
  }

  const { lineId } = await params;

  const [detail] = await db
    .select({
      id: aidContributionLine.id,
      campId: aidContributionLine.campId,
      campName: camp.name,
      aidTypeName: aidType.name,
      providerName: aidProvider.name,
      plannedQuantity: aidContributionLine.plannedQuantity,
      unit: aidContributionLine.unit,
      plannedDeliveryDate: aidContributionLine.plannedDeliveryDate,
      status: aidContributionLine.status,
      actualReceivedQuantity: aidContributionLine.actualReceivedQuantity,
      actualReceiptDate: aidContributionLine.actualReceiptDate,
      confirmationNotes: aidContributionLine.confirmationNotes,
      rejectionReason: aidContributionLine.rejectionReason,
      submittedAt: aidContribution.submittedAt,
    })
    .from(aidContributionLine)
    .innerJoin(
      aidContribution,
      eq(aidContributionLine.contributionId, aidContribution.id),
    )
    .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
    .innerJoin(aidType, eq(aidContributionLine.aidTypeId, aidType.id))
    .innerJoin(aidProvider, eq(aidContribution.providerId, aidProvider.id))
    .where(
      and(
        eq(aidContributionLine.id, lineId),
        eq(aidContribution.status, "submitted"),
      ),
    )
    .limit(1);

  if (!detail) {
    notFound();
  }

  // A Camp Manager may only confirm lines for their assigned camps.
  if (isCampManager) {
    const assigned = await getAssignedCampIds(session.user.id);
    if (!assigned.includes(detail.campId)) {
      redirect("/dashboard/incoming-aid");
    }
  }

  return <ReceiptConfirmation line={detail} />;
}
