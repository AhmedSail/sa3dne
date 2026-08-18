import { NextRequest, NextResponse } from "next/server";
import { guardApi } from "@/lib/auth/guard";
import { getOwnFamily } from "@/lib/families/access";
import { db } from "@/db";
import { family } from "@/db/schema/families";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * The beneficiary self-service household record.
 *
 * The row is always addressed through `family.user_id`, never through a
 * national ID in the request body: a body-supplied ID would let one beneficiary
 * overwrite another household's record just by knowing their ID number.
 */
const myFamilySchema = z.object({
  headName: z.string().min(2),
  memberCount: z.coerce.number().int().min(1),
  campId: z.string().min(1),
  phone: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/** Registration also needs the ID the household is registered under. */
const registerFamilySchema = myFamilySchema.extend({
  nationalId: z.string().min(4),
});

/**
 * Registers the household for an account that has none. Accounts created
 * through the normal flow already have one, so this only covers a beneficiary
 * whose record was never linked.
 */
export async function POST(req: NextRequest) {
  const guard = await guardApi(req, "family", "manage_own");
  if (!guard.ok) return guard.response;

  const parsed = registerFamilySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing required fields", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // One household per account: registering again would break the 1-1 link.
    if (await getOwnFamily(guard.actor)) {
      return NextResponse.json(
        { error: "A household is already registered for this account" },
        { status: 409 },
      );
    }

    const duplicate = await db
      .select({ id: family.id })
      .from(family)
      .where(
        and(
          eq(family.nationalId, parsed.data.nationalId),
          eq(family.status, "active"),
        ),
      )
      .limit(1);

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: "National ID is already in use by another active family" },
        { status: 409 },
      );
    }

    await db.insert(family).values({
      id: crypto.randomUUID(),
      userId: guard.actor.id,
      nationalId: parsed.data.nationalId,
      headName: parsed.data.headName,
      phone: parsed.data.phone || null,
      memberCount: parsed.data.memberCount,
      campId: parsed.data.campId,
      occupation: parsed.data.occupation || null,
      notes: parsed.data.notes || null,
      status: "active",
    });

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error registering own family:", err);
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
