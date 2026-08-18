import { db } from "@/db";
import { aidRequest, camp, aidType } from "@/db/schema";
import { guardApi, isWithinCampScope } from "@/lib/auth/guard";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createRequestSchema = z.object({
  campId: z.string().min(1, "Camp is required"),
  aidTypeId: z.string().min(1, "Aid type is required"),
  requestedQuantity: z.number().int().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  urgencyLevel: z.enum(["low", "medium", "high", "critical"]),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/aid-requests
 * Returns all active aid requests.
 * - Admin/Provider sees all open/in_progress requests across all camps.
 * - Camp Manager sees all their camp's requests (including fulfilled/cancelled).
 */
export async function GET(request: NextRequest) {
  const guard = await guardApi(request, "aidRequest", "read");
  if (!guard.ok) return guard.response;
  const { campIds } = guard;

  const filters = [];
  if (campIds !== null) {
    // Camp-scoped caller: their own camps' requests, in every status.
    if (campIds.length === 0) {
      return NextResponse.json([]);
    }
    filters.push(inArray(aidRequest.campId, campIds));
  } else {
    // Providers and Admins see open or in_progress requests
    filters.push(inArray(aidRequest.status, ["open", "in_progress"]));
  }

  const rows = await db
    .select({
      id: aidRequest.id,
      campId: aidRequest.campId,
      campName: camp.name,
      aidTypeId: aidRequest.aidTypeId,
      aidTypeName: aidType.name,
      requestedQuantity: aidRequest.requestedQuantity,
      fulfilledQuantity: aidRequest.fulfilledQuantity,
      unit: aidRequest.unit,
      urgencyLevel: aidRequest.urgencyLevel,
      notes: aidRequest.notes,
      status: aidRequest.status,
      createdAt: aidRequest.createdAt,
    })
    .from(aidRequest)
    .innerJoin(camp, eq(aidRequest.campId, camp.id))
    .innerJoin(aidType, eq(aidRequest.aidTypeId, aidType.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(aidRequest.createdAt));

  return NextResponse.json(rows);
}

/**
 * POST /api/aid-requests
 * Camp manager requests aid.
 */
export async function POST(request: NextRequest) {
  const guard = await guardApi(request, "aidRequest", "create");
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (!isWithinCampScope(guard.campIds, parsed.data.campId)) {
      return NextResponse.json(
        { error: "You are not assigned to this camp" },
        { status: 403 },
      );
    }

    // Check if the camp already has an open request today
    const [existing] = await db
      .select({ id: aidRequest.id })
      .from(aidRequest)
      .where(
        and(
          eq(aidRequest.campId, parsed.data.campId),
          inArray(aidRequest.status, ["open", "in_progress"]),
          sql`DATE(created_at) = CURRENT_DATE`
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "This camp already has an open aid request today. Please wait for it to be fulfilled or cancel it before requesting again." },
        { status: 409 }
      );
    }

    const newRequest = {
      id: crypto.randomUUID(),
      campId: parsed.data.campId,
      aidTypeId: parsed.data.aidTypeId,
      requestedQuantity: parsed.data.requestedQuantity,
      fulfilledQuantity: 0,
      unit: parsed.data.unit,
      urgencyLevel: parsed.data.urgencyLevel,
      notes: parsed.data.notes ?? null,
      status: "open" as const,
      requestedById: guard.actor.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(aidRequest).values(newRequest);

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating aid request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
