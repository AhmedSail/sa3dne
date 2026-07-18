import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { buildReceiptUpdate, confirmSchema } from "@/lib/contributions/receipt";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function loadLineScoped(session: any, lineId: string) {
  const rows = await db
    .select({
      line: aidContributionLine,
      contributionStatus: aidContribution.status,
    })
    .from(aidContributionLine)
    .innerJoin(
      aidContribution,
      eq(aidContributionLine.contributionId, aidContribution.id),
    )
    .where(eq(aidContributionLine.id, lineId))
    .limit(1);

  const found = rows[0];
  if (!found) return { notFound: true as const };

  const role = session.user.role;
  if (role !== "admin" && role !== "camp_manager") {
    return { forbidden: true as const };
  }
  if (role === "camp_manager") {
    const assigned = await getAssignedCampIds(session.user.id);
    if (!assigned.includes(found.line.campId)) {
      return { forbidden: true as const };
    }
  }
  return { line: found.line, contributionStatus: found.contributionStatus };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lineId } = await params;
  const scoped = await loadLineScoped(session, lineId);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // A draft line is never visible on the incoming-aid side.
  if (scoped.contributionStatus !== "submitted") {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }

  const [detail] = await db
    .select({
      id: aidContributionLine.id,
      contributionId: aidContributionLine.contributionId,
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
    .where(eq(aidContributionLine.id, lineId))
    .limit(1);

  return NextResponse.json(detail);
}

/**
 * PATCH /api/incoming-aid/[lineId]
 * Camp Manager (or admin) confirms receipt of a single line.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lineId } = await params;
  const scoped = await loadLineScoped(session, lineId);
  if (scoped.notFound) {
    return NextResponse.json({ error: "Line not found" }, { status: 404 });
  }
  if (scoped.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (scoped.contributionStatus !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted contribution lines can be confirmed" },
      { status: 409 },
    );
  }

  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const decision = buildReceiptUpdate(scoped.line, parsed.data, {
      userId: session.user.id,
      now: new Date(),
    });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.error }, { status: 400 });
    }

    await db
      .update(aidContributionLine)
      .set(decision.updates)
      .where(eq(aidContributionLine.id, lineId));

    return NextResponse.json({ success: true, status: decision.updates.status });
  } catch (error) {
    console.error("Error confirming receipt:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
