import { db } from "@/db";
import { aidContribution, aidProvider } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getActiveProviderForUser } from "@/lib/contributions/access";
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
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";

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

  if (isAdmin) {
    return NextResponse.json(rows);
  }

  // Provider: scope to own provider profile only.
  const provider = await getActiveProviderForUser(session.user.id);
  if (!provider) {
    return NextResponse.json([]);
  }
  return NextResponse.json(rows.filter((r) => r.providerId === provider.id));
}

/**
 * POST /api/contributions
 * Creates a draft contribution for the acting provider. A user without an
 * active provider profile cannot create a contribution.
 */
export async function POST(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = await getActiveProviderForUser(session.user.id);
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
      createdById: session.user.id,
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
