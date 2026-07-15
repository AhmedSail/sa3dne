import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import IncomingAidList from "@/components/IncomingAid/IncomingAidList";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IncomingAidPage() {
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

  let assignedCampIds: string[] = [];
  let unassigned = false;
  if (isCampManager) {
    assignedCampIds = await getAssignedCampIds(session.user.id);
    unassigned = assignedCampIds.length === 0;
  }

  const filters = [eq(aidContribution.status, "submitted")];
  if (isCampManager) {
    filters.push(inArray(aidContributionLine.campId, assignedCampIds));
  }

  const rows =
    isCampManager && unassigned
      ? []
      : await db
          .select({
            id: aidContributionLine.id,
            campName: camp.name,
            aidTypeName: aidType.name,
            providerName: aidProvider.name,
            plannedQuantity: aidContributionLine.plannedQuantity,
            unit: aidContributionLine.unit,
            plannedDeliveryDate: aidContributionLine.plannedDeliveryDate,
            status: aidContributionLine.status,
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
          .where(and(...filters))
          .orderBy(desc(aidContribution.submittedAt));

  return <IncomingAidList lines={rows} unassigned={unassigned} />;
}
