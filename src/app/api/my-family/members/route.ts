import { NextRequest, NextResponse } from "next/server";
import { guardApi } from "@/lib/auth/guard";
import { getOwnFamily } from "@/lib/families/access";
import { db } from "@/db";
import { familyMember } from "@/db/schema/families";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const memberSchema = z.object({
  name: z.string().min(2),
  relationship: z.string().min(1),
  educationLevel: z.string().min(1),
  gender: z.enum(["male", "female"]),
  nationalId: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const guard = await guardApi(req, "family", "manage_own");
  if (!guard.ok) return guard.response;

  const parsed = memberSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing required fields", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // The household is resolved from the session, so a member can only ever be
    // added to the caller's own family.
    const targetFamily = await getOwnFamily(guard.actor);
    if (!targetFamily) {
      return NextResponse.json(
        { error: "Family not found. Please save your family info first." },
        { status: 404 },
      );
    }

    await db.insert(familyMember).values({
      id: crypto.randomUUID(),
      familyId: targetFamily.id,
      nationalId: parsed.data.nationalId || null,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      educationLevel: parsed.data.educationLevel,
      gender: parsed.data.gender,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
    });

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error adding own family member:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
