import { NextRequest, NextResponse } from "next/server";
import { guardApi } from "@/lib/auth/guard";
import { getOwnFamily } from "@/lib/families/access";
import { db } from "@/db";
import { familyMember } from "@/db/schema/families";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(req, "family", "manage_own");
  if (!guard.ok) return guard.response;

  const { id: memberId } = await props.params;

  try {
    const userFamily = await getOwnFamily(guard.actor);
    if (!userFamily) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // Matching on both ids means a member of another household is reported as
    // missing rather than deleted.
    const member = await db
      .select()
      .from(familyMember)
      .where(
        and(
          eq(familyMember.id, memberId),
          eq(familyMember.familyId, userFamily.id),
        ),
      )
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        { error: "Member not found or not authorized to delete" },
        { status: 404 },
      );
    }

    await db.delete(familyMember).where(eq(familyMember.id, memberId));

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting own family member:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
