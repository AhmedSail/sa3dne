import { NextRequest, NextResponse } from "next/server";
import { guardApi } from "@/lib/auth/guard";
import { getOwnFamily, ownNationalId } from "@/lib/families/access";
import { db } from "@/db";
import { family } from "@/db/schema/families";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * The beneficiary self-service household record.
 *
 * The national ID is taken from the acting account, never from the request
 * body: a body-supplied ID would let one beneficiary overwrite another
 * household's record just by knowing their ID number.
 */
const myFamilySchema = z.object({
  headName: z.string().min(2),
  memberCount: z.coerce.number().int().min(1),
  campId: z.string().min(1),
  phone: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const guard = await guardApi(req, "family", "manage_own");
  if (!guard.ok) return guard.response;

  const parsed = myFamilySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing required fields", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const fields = {
    headName: parsed.data.headName,
    phone: parsed.data.phone || null,
    memberCount: parsed.data.memberCount,
    campId: parsed.data.campId,
    occupation: parsed.data.occupation || null,
    notes: parsed.data.notes || null,
  };

  try {
    const existing = await getOwnFamily(guard.actor);

    if (existing) {
      await db
        .update(family)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(family.id, existing.id));
    } else {
      await db.insert(family).values({
        id: crypto.randomUUID(),
        nationalId: ownNationalId(guard.actor),
        ...fields,
        status: "active",
      });
    }

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error saving own family:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await guardApi(req, "family", "manage_own");
  if (!guard.ok) return guard.response;

  const parsed = myFamilySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing required fields", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const existing = await getOwnFamily(guard.actor);
    if (!existing) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    await db
      .update(family)
      .set({
        headName: parsed.data.headName,
        phone: parsed.data.phone || null,
        memberCount: parsed.data.memberCount,
        campId: parsed.data.campId,
        occupation: parsed.data.occupation || null,
        notes: parsed.data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(family.id, existing.id));

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating own family:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
