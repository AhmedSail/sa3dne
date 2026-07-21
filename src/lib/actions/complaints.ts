"use server";

import { db } from "@/db";

import { complaints } from "@/db/schema/complaints";
import { campAssignment } from "@/db/schema/camps";
import { auth } from "@/lib/auth/auth";
import { eq, inArray, desc, and, or, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { submitComplaintSchema, trackComplaintSchema, updateComplaintSchema } from "@/lib/validations/complaint";
import { AuditAction, logAudit } from "@/lib/audit";
import { z } from "zod";

function generateTrackingNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CMP-${dateStr}-${randomStr}`;
}

export async function submitComplaint(data: z.infer<typeof submitComplaintSchema>) {
  const parsed = submitComplaintSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const trackingNumber = generateTrackingNumber();

  try {
    await db.insert(complaints).values({
      id: crypto.randomUUID(),
      ...parsed.data,
      trackingNumber,
      status: "pending",
    });

    return { trackingNumber };
  } catch (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء إرسال الطلب" };
  }
}

export async function trackComplaint(data: z.infer<typeof trackComplaintSchema>) {
  const parsed = trackComplaintSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "رقم تتبع غير صالح" };
  }

  try {
    const result = await db.query.complaints.findFirst({
      where: eq(complaints.trackingNumber, parsed.data.trackingNumber),
      columns: {
        trackingNumber: true,
        type: true,
        status: true,
        resolutionNotes: true,
        rejectionReason: true,
        createdAt: true,
      },
      with: {
        campId: false,
      }
    });

    if (!result) {
      return { error: "لم يتم العثور على طلب بهذا الرقم" };
    }

    // Workaround since Drizzle relation `with` might not be defined for camp name if we don't need it.
    // Let's just return the result.
    return { complaint: result };
  } catch (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء البحث عن الطلب" };
  }
}

export async function getComplaints(filters?: { status?: string, type?: string, keyword?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("غير مصرح");
  }

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "camp_manager") {
    throw new Error("غير مصرح");
  }

  let campIds: string[] = [];
  if (role === "camp_manager") {
    const assignments = await db.query.campAssignment.findMany({
      where: eq(campAssignment.userId, session.user.id),
      columns: { campId: true },
    });
    campIds = assignments.map((a) => a.campId);
    
    if (campIds.length === 0) {
      return []; // Manager with no camps
    }
  }

  const conditions = [];
  
  if (role === "camp_manager") {
    conditions.push(inArray(complaints.campId, campIds));
  }
  
  if (filters?.status) {
    conditions.push(eq(complaints.status, filters.status as any));
  }
  
  if (filters?.type) {
    conditions.push(eq(complaints.type, filters.type as any));
  }
  
  if (filters?.keyword) {
    const kw = `%${filters.keyword}%`;
    conditions.push(
      or(
        ilike(complaints.trackingNumber, kw),
        ilike(complaints.beneficiaryName, kw)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const results = await db
      .select()
      .from(complaints)
      .where(whereClause)
      .orderBy(desc(complaints.createdAt));

    return results;
  } catch (error) {
    console.error(error);
    throw new Error("فشل في استرجاع البيانات");
  }
}

export async function updateComplaintStatus(id: string, data: z.infer<typeof updateComplaintSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "غير مصرح" };
  }

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "camp_manager") {
    return { error: "غير مصرح" };
  }

  const parsed = updateComplaintSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  try {
    const complaint = await db.query.complaints.findFirst({
      where: eq(complaints.id, id),
    });

    if (!complaint) {
      return { error: "الطلب غير موجود" };
    }

    if (role === "camp_manager") {
      const assignments = await db.query.campAssignment.findMany({
        where: eq(campAssignment.userId, session.user.id),
      });
      const campIds = assignments.map((a) => a.campId);
      if (!campIds.includes(complaint.campId)) {
        return { error: "غير مصرح لك بتعديل هذا المخيم" };
      }
    }

    await db.update(complaints)
      .set({
        ...parsed.data,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      })
      .where(eq(complaints.id, id));

    const reqHeaders = await headers();
    await logAudit({
      userId: session.user.id,
      action: AuditAction.COMPLAINT_STATUS_CHANGE,
      entityType: "complaint",
      entityId: id,
      oldValue: { status: complaint.status },
      newValue: { status: parsed.data.status },
      request: { headers: reqHeaders },
    });

    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${id}`);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء التحديث" };
  }
}
