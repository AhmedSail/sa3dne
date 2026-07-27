import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { family, familyMember } from "@/db/schema/families";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "beneficiary") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, nationalId, relationship, educationLevel, gender, birthDate } = body;

  if (!name || !relationship || !educationLevel || !gender) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Find the family for this user
    const userNationalId = session.user.email.split("@")[0]; // Assuming email is ID@sa3dne.local
    
    // Fallback if the user used a real email, but we store nationalId in the family table.
    // Wait, let's just query by the user's email if that's what was used for nationalId.
    // In our DB, nationalId might be the email or the ID.
    const families = await db.select().from(family).where(eq(family.nationalId, session.user.email)).limit(1);
    
    // If not found by email, try parsing the ID from the email
    let targetFamily = families[0];
    if (!targetFamily) {
       const possibleId = session.user.email.replace("@sa3dne.local", "");
       const idFamilies = await db.select().from(family).where(eq(family.nationalId, possibleId)).limit(1);
       targetFamily = idFamilies[0];
    }

    if (!targetFamily) {
      return NextResponse.json({ error: "Family not found. Please save your family info first." }, { status: 404 });
    }

    await db.insert(familyMember).values({
      id: crypto.randomUUID(),
      familyId: targetFamily.id,
      nationalId: nationalId || null,
      name,
      relationship,
      educationLevel,
      gender,
      birthDate: birthDate ? new Date(birthDate) : null,
    });

    revalidatePath("/dashboard/my-family");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
