import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import ContributionDetail from "@/components/Contributions/ContributionDetail";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContributionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  const [contribution] = await db
    .select()
    .from(aidContribution)
    .where(eq(aidContribution.id, id))
    .limit(1);

  if (!contribution) {
    notFound();
  }

  // Server-side scope: admin can view any, a provider only their own.
  const isAdmin = session.user.role === "admin";
  const provider = isAdmin ? null : await getActiveProviderForUser(session.user.id);
  const isOwner = provider?.id === contribution.providerId;
  if (!isAdmin && !isOwner) {
    redirect("/dashboard/contributions");
  }

  const [providerRow] = await db
    .select({ name: aidProvider.name })
    .from(aidProvider)
    .where(eq(aidProvider.id, contribution.providerId))
    .limit(1);

  const lines = await db
    .select({
      id: aidContributionLine.id,
      campId: aidContributionLine.campId,
      campName: camp.name,
      aidTypeId: aidContributionLine.aidTypeId,
      aidTypeName: aidType.name,
      plannedQuantity: aidContributionLine.plannedQuantity,
      unit: aidContributionLine.unit,
      plannedDeliveryDate: aidContributionLine.plannedDeliveryDate,
      status: aidContributionLine.status,
      actualReceivedQuantity: aidContributionLine.actualReceivedQuantity,
      actualReceiptDate: aidContributionLine.actualReceiptDate,
      confirmationNotes: aidContributionLine.confirmationNotes,
      rejectionReason: aidContributionLine.rejectionReason,
    })
    .from(aidContributionLine)
    .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
    .innerJoin(aidType, eq(aidContributionLine.aidTypeId, aidType.id))
    .where(eq(aidContributionLine.contributionId, id));

  const canEdit = contribution.status === "draft" && (isAdmin || isOwner);

  // Only load selectable master data when the draft can still be edited.
  const camps = canEdit
    ? await db
        .select({ id: camp.id, name: camp.name })
        .from(camp)
        .where(and(eq(camp.status, "active"), ne(camp.operationalStatus, "closed")))
        .orderBy(camp.name)
    : [];

  const aidTypes = canEdit
    ? await db
        .select({ id: aidType.id, name: aidType.name, defaultUnit: aidType.defaultUnit })
        .from(aidType)
        .where(eq(aidType.status, "active"))
        .orderBy(aidType.name)
    : [];

  return (
    <ContributionDetail
      contribution={{
        id: contribution.id,
        status: contribution.status,
        notes: contribution.notes,
        submittedAt: contribution.submittedAt,
        createdAt: contribution.createdAt,
        providerName: providerRow?.name ?? null,
      }}
      lines={lines}
      camps={camps}
      aidTypes={aidTypes}
      canEdit={canEdit}
    />
  );
}
