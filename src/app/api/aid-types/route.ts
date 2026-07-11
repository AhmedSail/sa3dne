import { db } from "@/db";
import { aidType } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createAidTypeSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  defaultUnit: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active aid types
  const types = await db.select().from(aidType).where(eq(aidType.status, "active"));
  return NextResponse.json(types);
}

export async function POST(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createAidTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Check uniqueness of active aid type name
    const duplicate = await db
      .select()
      .from(aidType)
      .where(
        and(
          eq(aidType.name, parsed.data.name),
          eq(aidType.status, "active")
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: "This active aid type already exists" },
        { status: 400 }
      );
    }

    const newType = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      category: parsed.data.category,
      defaultUnit: parsed.data.defaultUnit,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(aidType).values(newType);
    return NextResponse.json(newType, { status: 201 });
  } catch (error) {
    console.error("Error creating aid type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
