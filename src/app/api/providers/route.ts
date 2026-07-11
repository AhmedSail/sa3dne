import { db } from "@/db";
import { aidProvider, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createProviderSchema = z.object({
  type: z.enum(["organization", "independent_initiator"]),
  name: z.string().min(2),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
  linkedUserId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active providers
  const providers = await db
    .select()
    .from(aidProvider)
    .where(eq(aidProvider.status, "active"));
  return NextResponse.json(providers);
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
    const parsed = createProviderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { type, name, contactPerson, phone, email, notes, linkedUserId } = parsed.data;

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

    const newProvider = {
      id: crypto.randomUUID(),
      type,
      name,
      contactPerson: contactPerson ?? null,
      phone: phone ?? null,
      email: email ?? null,
      notes: notes ?? null,
      linkedUserId: linkedUserId ?? null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(aidProvider).values(newProvider);
    return NextResponse.json(newProvider, { status: 201 });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
