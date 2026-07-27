import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { family, familyMember } from "@/db/schema/families";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "beneficiary") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Find the family for this user
    let userFamily = await db.select().from(family).where(eq(family.nationalId, session.user.email)).limit(1);
    if (userFamily.length === 0) {
      const possibleId = session.user.email.replace("@sa3dne.local", "");
      userFamily = await db.select().from(family).where(eq(family.nationalId, possibleId)).limit(1);
    }
    
    if (userFamily.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Ensure the member belongs to this family
    const memberId = params.id;
    const member = await db.select().from(familyMember).where(and(
      eq(familyMember.id, memberId),
      eq(familyMember.familyId, userFamily[0].id)
    )).limit(1);

    if (member.length === 0) {
      return NextResponse.json({ error: "Member not found or not authorized to delete" }, { status: 404 });
    }

    await db.delete(familyMember).where(eq(familyMember.id, memberId));

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
