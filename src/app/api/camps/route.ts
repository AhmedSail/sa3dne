import { db } from "@/db";
import { camp } from "@/db/schema";
import { guardApi } from "@/lib/auth/guard";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createCampSchema = z.object({
  name: z.string().min(2),
  location: z.enum(["north_gaza", "gaza_city", "middle_area", "khan_yunis", "rafah"]),
  capacity: z.number().int().positive("Capacity must be greater than zero"),
  operationalStatus: z.enum(["active", "inactive", "closed"]).default("active"),
  needLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const guard = await guardApi(request, "camp", "read");
  if (!guard.ok) return guard.response;
  const { campIds } = guard;

  // A Camp Manager only ever gets their assigned camps; an empty scope means
  // no assignment and must return nothing.
  if (campIds !== null && campIds.length === 0) {
    return NextResponse.json([]);
  }

  const camps = await db
    .select()
    .from(camp)
    .where(campIds === null ? undefined : inArray(camp.id, campIds));

  return NextResponse.json(camps);
}

export async function POST(request: NextRequest) {
  const guard = await guardApi(request, "camp", "create");
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const parsed = createCampSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const newCamp = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      location: parsed.data.location,
      capacity: parsed.data.capacity,
      operationalStatus: parsed.data.operationalStatus,
      needLevel: parsed.data.needLevel,
      notes: parsed.data.notes ?? null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(camp).values(newCamp);
    return NextResponse.json(newCamp, { status: 201 });
  } catch (error) {
    console.error("Error creating camp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
