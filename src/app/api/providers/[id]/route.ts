import { db } from "@/db";
import { aidProvider, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProviderSchema = z.object({
  type: z.enum(["organization", "independent_initiator"]).optional(),
  name: z.string().min(2).optional(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
  linkedUserId: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateProviderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const currentProvider = await db.select().from(aidProvider).where(eq(aidProvider.id, id)).limit(1);
    if (currentProvider.length === 0) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const type = parsed.data.type ?? currentProvider[0].type;
    const linkedUserId = parsed.data.linkedUserId !== undefined ? parsed.data.linkedUserId : currentProvider[0].linkedUserId;

    // Validate linked user if provided
    if (linkedUserId) {
      const linkedUser = await db
        .select()
        .from(user)
        .where(eq(user.id, linkedUserId))
        .limit(1);

      if (linkedUser.length === 0) {
        return NextResponse.json({ error: "Linked user not found" }, { status: 400 });
      }

      if (linkedUser[0].banned) {
        return NextResponse.json({ error: "Linked user is deactivated/banned" }, { status: 400 });
      }

      // Check role compatibility
      const urole = linkedUser[0].role;
      if (type === "organization" && urole !== "org_representative") {
        return NextResponse.json(
          { error: "Organization provider must be linked to an Organization Representative account" },
          { status: 400 }
        );
      }

      if (type === "independent_initiator" && urole !== "independent_initiator") {
        return NextResponse.json(
          { error: "Independent initiator provider must be linked to an Independent Aid Initiator account" },
          { status: 400 }
        );
      }
    }

    const updates: any = {
      updatedAt: new Date(),
    };
    if (parsed.data.type !== undefined) updates.type = parsed.data.type;
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.contactPerson !== undefined) updates.contactPerson = parsed.data.contactPerson;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.linkedUserId !== undefined) updates.linkedUserId = parsed.data.linkedUserId;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;

    await db.update(aidProvider).set(updates).where(eq(aidProvider.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Soft delete / deactivate
    await db
      .update(aidProvider)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(aidProvider.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
