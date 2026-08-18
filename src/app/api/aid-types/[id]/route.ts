import { db } from "@/db";
import { aidType } from "@/db/schema";
import { guardApi } from "@/lib/auth/guard";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateAidTypeSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  defaultUnit: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "aidType", "update");
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateAidTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const currentType = await db.select().from(aidType).where(eq(aidType.id, id)).limit(1);
    if (currentType.length === 0) {
      return NextResponse.json({ error: "Aid type not found" }, { status: 404 });
    }

    // Check uniqueness of active name if name is updated
    if (parsed.data.name !== undefined) {
      const duplicate = await db
        .select()
        .from(aidType)
        .where(
          and(
            eq(aidType.name, parsed.data.name),
            ne(aidType.id, id),
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
    }

    const updates: any = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.category !== undefined) updates.category = parsed.data.category;
    if (parsed.data.defaultUnit !== undefined) updates.defaultUnit = parsed.data.defaultUnit;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;

    await db.update(aidType).set(updates).where(eq(aidType.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating aid type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request, "aidType", "delete");
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    // Soft delete / deactivate
    await db
      .update(aidType)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(aidType.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating aid type:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
