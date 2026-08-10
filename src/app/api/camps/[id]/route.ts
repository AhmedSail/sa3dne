import { db } from "@/db";
import { camp, campAssignment, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCampSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.enum(["north_gaza", "gaza_city", "middle_area", "khan_yunis", "rafah"]).optional(),
  capacity: z.number().int().positive("Capacity must be greater than zero").optional(),
  operationalStatus: z.enum(["active", "inactive", "closed"]).optional(),
  needLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  assignedManagers: z.array(z.string()).optional(), // Array of userIds
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Server-side scope: a Camp Manager may only read a camp they are assigned to.
  if (session.user.role === "camp_manager") {
    const assigned = await getAssignedCampIds(session.user.id);
    if (!assigned.includes(id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const campData = await db.select().from(camp).where(eq(camp.id, id)).limit(1);

  if (campData.length === 0) {
    return NextResponse.json({ error: "Camp not found" }, { status: 404 });
  }

  // Get assigned managers
  const assignments = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(campAssignment)
    .innerJoin(user, eq(campAssignment.userId, user.id))
    .where(eq(campAssignment.campId, id));

  return NextResponse.json({
    ...campData[0],
    assignedManagers: assignments,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateCampSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const currentCamp = await db.select().from(camp).where(eq(camp.id, id)).limit(1);
    if (currentCamp.length === 0) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.location !== undefined) updates.location = parsed.data.location;
    if (parsed.data.capacity !== undefined) updates.capacity = parsed.data.capacity;
    if (parsed.data.operationalStatus !== undefined) updates.operationalStatus = parsed.data.operationalStatus;
    if (parsed.data.needLevel !== undefined) updates.needLevel = parsed.data.needLevel;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;

    await db.update(camp).set(updates).where(eq(camp.id, id));

    // Handle assigned managers if provided
    if (parsed.data.assignedManagers !== undefined) {
      // 1. Delete old assignments
      await db.delete(campAssignment).where(eq(campAssignment.campId, id));

      // 2. Insert new assignments
      for (const userId of parsed.data.assignedManagers) {
        await db.insert(campAssignment).values({
          id: crypto.randomUUID(),
          campId: id,
          userId: userId,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating camp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Soft delete by setting status to inactive and operationalStatus to closed
    await db
      .update(camp)
      .set({
        status: "inactive",
        operationalStatus: "closed",
        updatedAt: new Date(),
      })
      .where(eq(camp.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating camp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
