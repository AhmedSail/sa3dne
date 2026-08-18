import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  camp,
} from "@/db/schema";
import { can, guardApi } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { deriveDisplayStatus, isCancellable } from "@/lib/contributions/status";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createContributionSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/contributions
 *
 * Admin sees all contributions; a Camp Manager only the ones with a line in a
 * camp they are assigned to; a provider only their own. `?providerId=` narrows
 * the result to a single provider — this is what the provider directory's
 * contribution history reads — and never widens what the caller may see.
 */
export async function GET(request: NextRequest) {
  const guard = await guardApi(request, "contribution", "read");
  if (!guard.ok) return guard.response;

  const providerIdParam = request.nextUrl.searchParams.get("providerId");

  // A camp-side role sees every contribution; a provider only its own.
  const seesAll = can(guard.actor.role, "contribution", "receive");

  let providerId = providerIdParam;
  if (!seesAll) {
    // Provider: scope to own provider profile only. An explicit providerId for
    // somebody else's profile resolves to an empty list, not to their data.
    const provider = await getActiveProviderForUser(guard.actor.id);
    if (!provider) return NextResponse.json([]);
    if (providerIdParam && providerIdParam !== provider.id) {
      return NextResponse.json([]);
    }
    providerId = provider.id;
  }

  const rows = await db
    .select({
      id: aidContribution.id,
      providerId: aidContribution.providerId,
      providerName: aidProvider.name,
      status: aidContribution.status,
      notes: aidContribution.notes,
      submittedAt: aidContribution.submittedAt,
      createdAt: aidContribution.createdAt,
    })
    .from(aidContribution)
    .innerJoin(aidProvider, eq(aidContribution.providerId, aidProvider.id))
    .where(providerId ? eq(aidContribution.providerId, providerId) : undefined)
    .orderBy(desc(aidContribution.createdAt));

  if (rows.length === 0) return NextResponse.json([]);

  // Lines carry the camps and the receipt statuses the display status is
  // derived from. A Camp Manager only ever sees the lines for their own camps.
  const campIds = seesAll ? guard.campIds : null;
  const lines = await db
    .select({
      contributionId: aidContributionLine.contributionId,
      campId: aidContributionLine.campId,
      campName: camp.name,
      status: aidContributionLine.status,
    })
    .from(aidContributionLine)
    .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
    .where(
      and(
        inArray(
          aidContributionLine.contributionId,
          rows.map((r) => r.id),
        ),
        campIds ? inArray(aidContributionLine.campId, campIds) : undefined,
      ),
    );

  const enrichedRows = rows.map((row) => {
    const own = lines.filter((l) => l.contributionId === row.id);
    const lineStatuses = own.map((l) => l.status);

    return {
      ...row,
      displayStatus: deriveDisplayStatus(row.status, lineStatuses),
      cancellable: isCancellable(row.status, lineStatuses),
      camps: [...new Map(own.map((l) => [l.campId, l.campName])).entries()].map(
        ([id, name]) => ({ id, name }),
      ),
    };
  });

  // A Camp Manager has no business seeing a contribution that never touched
  // one of their camps, so scoping the lines also drops the whole row.
  return NextResponse.json(
    campIds ? enrichedRows.filter((r) => r.camps.length > 0) : enrichedRows,
  );
}

/**
 * POST /api/contributions
 * Creates a draft contribution for the acting provider. A user without an
 * active provider profile cannot create a contribution.
 */
export async function POST(request: NextRequest) {
  const guard = await guardApi(request, "contribution", "read");
  if (!guard.ok) return guard.response;

  // The real gate is the provider profile: a contribution always belongs to a
  // specific provider, so an account without one has nothing to create it as.
  const provider = await getActiveProviderForUser(guard.actor.id);
  if (!provider) {
    return NextResponse.json(
      { error: "No active provider profile linked to this account" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createContributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const now = new Date();
    const newContribution = {
      id: crypto.randomUUID(),
      providerId: provider.id,
      status: "draft" as const,
      notes: parsed.data.notes ?? null,
      submittedAt: null,
      createdById: guard.actor.id,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(aidContribution).values(newContribution);
    return NextResponse.json(newContribution, { status: 201 });
  } catch (error) {
    console.error("Error creating contribution:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
