import { can, guardApi } from "@/lib/auth/guard";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  campId: z.string().optional().nullable(),
  role: z.enum([
    "user",
    "admin",
    "camp_manager",
    "org_representative",
    "independent_initiator",
    "beneficiary",
  ]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "user", "update");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Changing a role is privilege assignment, a stronger permission than
  // editing a profile. The whole permission model rests on this check.
  if (parsed.data.role !== undefined && !can(guard.actor.role, "role", "assign")) {
    return NextResponse.json(
      { error: "You are not authorized to assign roles" },
      { status: 403 },
    );
  }

  const updates: any = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;

  // Use transaction to update user and handle campAssignment
  await db.transaction(async (tx) => {
    if (Object.keys(updates).length > 0) {
      await tx.update(user).set(updates).where(eq(user.id, id));
    }

    if (parsed.data.role === "camp_manager" && parsed.data.campId) {
      const { campAssignment } = await import("@/db/schema/camps");
      // Delete existing assignments for this user
      await tx.delete(campAssignment).where(eq(campAssignment.userId, id));
      // Insert new assignment
      await tx.insert(campAssignment).values({
        id: crypto.randomUUID(),
        campId: parsed.data.campId,
        userId: id,
        createdAt: new Date(),
      });
    } else if (parsed.data.role !== undefined && parsed.data.role !== "camp_manager") {
       const { campAssignment } = await import("@/db/schema/camps");
       await tx.delete(campAssignment).where(eq(campAssignment.userId, id));
    }
  });

  return NextResponse.json({ success: true });
}
