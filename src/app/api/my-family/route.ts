import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { family } from "@/db/schema/families";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "beneficiary") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { nationalId, headName, phone, memberCount, campId, occupation, notes } = body;

  if (!nationalId || !headName || !memberCount || !campId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const existing = await db.select().from(family).where(eq(family.nationalId, nationalId)).limit(1);
    
    if (existing.length > 0) {
      await db.update(family)
        .set({
          headName,
          phone: phone || null,
          memberCount: Number(memberCount),
          campId,
          occupation: occupation || null,
          notes: notes || null,
          updatedAt: new Date(),
        })
        .where(eq(family.nationalId, nationalId));
    } else {
      await db.insert(family).values({
        id: crypto.randomUUID(),
        nationalId,
        headName,
        phone: phone || null,
        memberCount: Number(memberCount),
        campId,
        occupation: occupation || null,
        notes: notes || null,
        status: "active",
      });
    }

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "beneficiary") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { nationalId, headName, phone, memberCount, campId, occupation, notes } = body;

  if (!nationalId || !headName || !memberCount || !campId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await db.update(family)
      .set({
        headName,
        phone: phone || null,
        memberCount: Number(memberCount),
        campId,
        occupation: occupation || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(family.nationalId, nationalId));

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
