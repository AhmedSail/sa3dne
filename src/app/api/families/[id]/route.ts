import { db } from "@/db";
import { family, familyMember } from "@/db/schema";
import { can, guardApi, isWithinCampScope } from "@/lib/auth/guard";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateFamilySchema = z.object({
  campId: z.string().optional(),
  headName: z.string().min(2).optional(),
  nationalId: z.string().min(4).optional(),
  phone: z.string().optional().nullable(),
  memberCount: z.number().int().min(1).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  inactiveReason: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  members: z.array(
    z.object({
      nationalId: z.string().min(4).optional().nullable(),
      name: z.string().min(2),
      relationship: z.string(),
      educationLevel: z.string(),
      gender: z.enum(["male", "female"]),
      birthDate: z.string().optional().nullable(),
    })
  ).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "family", "read", { records: true });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const familyData = await db.select().from(family).where(eq(family.id, id)).limit(1);

  if (familyData.length === 0) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  if (!isWithinCampScope(guard.campIds, familyData[0].campId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get family members
  const members = await db.select().from(familyMember).where(eq(familyMember.familyId, id));

  return NextResponse.json({
    ...familyData[0],
    members,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "family", "update");
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const currentFamily = await db.select().from(family).where(eq(family.id, id)).limit(1);
    if (currentFamily.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Both the current camp and the target camp must be inside the actor's
    // scope, otherwise a family could be moved into or out of a camp the actor
    // does not manage.
    const checkCamps = [currentFamily[0].campId];
    const movesCamp =
      Boolean(parsed.data.campId) && parsed.data.campId !== currentFamily[0].campId;
    if (movesCamp) {
      checkCamps.push(parsed.data.campId!);

      if (!can(guard.actor.role, "family", "transfer")) {
        return NextResponse.json(
          { error: "You are not authorized to transfer families between camps" },
          { status: 403 },
        );
      }
    }

    for (const cid of checkCamps) {
      if (!isWithinCampScope(guard.campIds, cid)) {
        return NextResponse.json(
          { error: "You are not authorized to manage families in this camp" },
          { status: 403 },
        );
      }
    }

    // Check if duplicate active nationalId exists for another family
    if (parsed.data.nationalId !== undefined) {
      const duplicate = await db
        .select()
        .from(family)
        .where(
          and(
            eq(family.nationalId, parsed.data.nationalId),
            ne(family.id, id),
            eq(family.status, "active")
          )
        )
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: "National ID is already in use by another active family" },
          { status: 400 }
        );
      }
    }

    const updates: any = {
      updatedAt: new Date(),
    };
    if (parsed.data.campId !== undefined) updates.campId = parsed.data.campId;
    if (parsed.data.headName !== undefined) updates.headName = parsed.data.headName;
    if (parsed.data.nationalId !== undefined) updates.nationalId = parsed.data.nationalId;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.memberCount !== undefined) updates.memberCount = parsed.data.memberCount;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.inactiveReason !== undefined) updates.inactiveReason = parsed.data.inactiveReason;
    if (parsed.data.occupation !== undefined) updates.occupation = parsed.data.occupation;

    await db.transaction(async (tx) => {
      await tx.update(family).set(updates).where(eq(family.id, id));

      if (parsed.data.members !== undefined) {
        // Delete all old members first
        await tx.delete(familyMember).where(eq(familyMember.familyId, id));

        // Re-insert members
        for (const m of parsed.data.members) {
          await tx.insert(familyMember).values({
            id: crypto.randomUUID(),
            familyId: id,
            nationalId: m.nationalId ?? null,
            name: m.name,
            relationship: m.relationship,
            educationLevel: m.educationLevel,
            gender: m.gender,
            birthDate: m.birthDate ? new Date(m.birthDate) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating family:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "family", "delete");
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    const currentFamily = await db.select().from(family).where(eq(family.id, id)).limit(1);
    if (currentFamily.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    if (!isWithinCampScope(guard.campIds, currentFamily[0].campId)) {
      return NextResponse.json(
        { error: "You are not authorized to manage families in this camp" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const inactiveReason = body.inactiveReason || "Deactivated by manager";

    // Soft delete family
    await db
      .update(family)
      .set({
        status: "inactive",
        inactiveReason: inactiveReason,
        updatedAt: new Date(),
      })
      .where(eq(family.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating family:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
