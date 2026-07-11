import { db } from "@/db";
import { family, campAssignment, familyMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createFamilySchema = z.object({
  campId: z.string(),
  headName: z.string().min(2),
  nationalId: z.string().min(4),
  phone: z.string().optional().nullable(),
  memberCount: z.number().int().min(1, "Member count must be at least 1"),
  notes: z.string().optional().nullable(),
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

export async function GET(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If camp manager, filter by their assigned camps
  if (session.user.role === "camp_manager") {
    const assignedCamps = await db
      .select({ campId: campAssignment.campId })
      .from(campAssignment)
      .where(eq(campAssignment.userId, session.user.id));
    const campIds = assignedCamps.map((c) => c.campId);

    if (campIds.length === 0) {
      return NextResponse.json([]); // No assigned camps
    }

    const families = await db.select().from(family).where(eq(family.status, "active"));
    const filtered = families.filter((f) => campIds.includes(f.campId));
    return NextResponse.json(filtered);
  }

  // Admin or other roles see all active families
  const families = await db.select().from(family).where(eq(family.status, "active"));
  return NextResponse.json(families);
}

export async function POST(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Role-based validation
    if (session.user.role === "camp_manager") {
      // Check if camp is assigned to this manager
      const assignment = await db
        .select()
        .from(campAssignment)
        .where(
          and(
            eq(campAssignment.campId, parsed.data.campId),
            eq(campAssignment.userId, session.user.id)
          )
        )
        .limit(1);

      if (assignment.length === 0) {
        return NextResponse.json(
          { error: "You are not authorized to manage this camp" },
          { status: 403 }
        );
      }
    } else if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if duplicate active nationalId exists
    const duplicate = await db
      .select()
      .from(family)
      .where(
        and(
          eq(family.nationalId, parsed.data.nationalId),
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

    const familyId = crypto.randomUUID();
    const newFamily = {
      id: familyId,
      campId: parsed.data.campId,
      headName: parsed.data.headName,
      nationalId: parsed.data.nationalId,
      phone: parsed.data.phone ?? null,
      memberCount: parsed.data.memberCount,
      occupation: parsed.data.occupation ?? null,
      notes: parsed.data.notes ?? null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.transaction(async (tx) => {
      await tx.insert(family).values(newFamily);

      if (parsed.data.members && parsed.data.members.length > 0) {
        for (const m of parsed.data.members) {
          await tx.insert(familyMember).values({
            id: crypto.randomUUID(),
            familyId: familyId,
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

    return NextResponse.json(newFamily, { status: 201 });
  } catch (error) {
    console.error("Error creating family:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
