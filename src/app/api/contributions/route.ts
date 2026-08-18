import { db } from "@/db";
import { aidContribution, aidProvider } from "@/db/schema";
import { can, guardApi } from "@/lib/auth/guard";
import { getActiveProviderForUser } from "@/lib/contributions/access";
import { deriveDisplayStatus, isCancellable } from "@/lib/contributions/status";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createContributionSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/contributions
 * Admin sees all contributions; a provider sees only their own.
 */
export async function GET(request: NextRequest) {
  const guard = await guardApi(request, "contribution", "read");
  if (!guard.ok) return guard.response;

  // A camp-side role sees every contribution; a provider only its own.
  const seesAll = can(guard.actor.role, "contribution", "receive");

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
    .orderBy(desc(aidContribution.createdAt));

  // Fetch all lines to derive display status
  const allLines = await db.query.aidContributionLine.findMany({
    columns: { contributionId: true, status: true },
  });

  const enrichedRows = rows.map((row) => {
    const lineStatuses = allLines
      .filter((l) => l.contributionId === row.id)
      .map((l) => l.status);

    return {
      ...row,
      displayStatus: deriveDisplayStatus(row.status, lineStatuses),
      cancellable: isCancellable(row.status, lineStatuses),
    };
  });

  if (seesAll) {
    return NextResponse.json(enrichedRows);
  }

  // Provider: scope to own provider profile only.
  const provider = await getActiveProviderForUser(guard.actor.id);
  if (!provider) {
    return NextResponse.json([]);
  }
  return NextResponse.json(enrichedRows.filter((r) => r.providerId === provider.id));
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
