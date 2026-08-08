"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { familyUpdateRequest } from "@/db/schema/family_requests";
import { family, familyMember } from "@/db/schema/families";
import { eq, and, desc } from "drizzle-orm";

export async function submitUpdateFamilyRequest(data: {
  familyId: string;
  type: "add_member" | "remove_member" | "update_family_info" | "update_member";
  payload: any;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "يرجى تسجيل الدخول أولاً" };
  }

  try {
    // Restrict to 1 pending request per family to prevent conflicting updates
    const existingPending = await db.query.familyUpdateRequest.findFirst({
      where: (req, { eq, and }) =>
        and(eq(req.familyId, data.familyId), eq(req.status, "pending")),
    });

    if (existingPending) {
      return {
        error: "يوجد لديك طلب تحديث قيد المراجعة بالفعل. يرجى الانتظار حتى تتم معالجته.",
      };
    }

    await db.insert(familyUpdateRequest).values({
      id: crypto.randomUUID(),
      familyId: data.familyId,
      requestedById: session.user.id,
      type: data.type,
      payload: data.payload,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/dashboard/my-family");
    return { success: true };
  } catch (error: any) {
    console.error("Submit family update request error:", error);
    return { error: error.message || "حدث خطأ أثناء تقديم الطلب" };
  }
}

export async function approveFamilyRequest(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || ((session.user as any).role !== "camp_manager" && (session.user as any).role !== "admin")) {
    return { error: "غير مصرح لك بهذه العملية" };
  }

  try {
    const request = await db.query.familyUpdateRequest.findFirst({
      where: (req, { eq }) => eq(req.id, requestId),
    });

    if (!request || request.status !== "pending") {
      return { error: "الطلب غير موجود أو تمت معالجته مسبقاً" };
    }

    await db.transaction(async (tx) => {
      // 1. Update status
      await tx
        .update(familyUpdateRequest)
        .set({
          status: "approved",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(familyUpdateRequest.id, requestId));

      // 2. Apply payload
      const payload = request.payload as any;

      if (request.type === "add_member") {
        await tx.insert(familyMember).values({
          id: crypto.randomUUID(),
          familyId: request.familyId,
          ...payload.member,
          birthDate: payload.member.birthDate ? new Date(payload.member.birthDate) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Update member count
        const fam = await tx.query.family.findFirst({ where: eq(family.id, request.familyId) });
        if (fam) {
          await tx.update(family).set({ memberCount: fam.memberCount + 1 }).where(eq(family.id, request.familyId));
        }
      } else if (request.type === "remove_member") {
        await tx.delete(familyMember).where(eq(familyMember.id, payload.memberId));
        
        // Update member count
        const fam = await tx.query.family.findFirst({ where: eq(family.id, request.familyId) });
        if (fam && fam.memberCount > 0) {
          await tx.update(family).set({ memberCount: fam.memberCount - 1 }).where(eq(family.id, request.familyId));
        }
      } else if (request.type === "update_family_info") {
        await tx.update(family).set({
          ...payload.fields,
          updatedAt: new Date(),
        }).where(eq(family.id, request.familyId));
      } else if (request.type === "update_member") {
        const updateFields = { ...payload.fields };
        if (updateFields.birthDate) {
          updateFields.birthDate = new Date(updateFields.birthDate);
        }
        await tx.update(familyMember).set({
          ...updateFields,
          updatedAt: new Date(),
        }).where(eq(familyMember.id, payload.memberId));
      }
    });

    revalidatePath("/dashboard/family-requests");
    revalidatePath("/dashboard/my-family");
    return { success: true };
  } catch (error: any) {
    console.error("Approve family request error:", error);
    return { error: error.message || "حدث خطأ أثناء الموافقة على الطلب" };
  }
}

export async function rejectFamilyRequest(requestId: string, reason: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || ((session.user as any).role !== "camp_manager" && (session.user as any).role !== "admin")) {
    return { error: "غير مصرح لك بهذه العملية" };
  }

  if (!reason || reason.trim() === "") {
    return { error: "يرجى كتابة سبب الرفض" };
  }

  try {
    await db
      .update(familyUpdateRequest)
      .set({
        status: "rejected",
        rejectionReason: reason,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(familyUpdateRequest.id, requestId), eq(familyUpdateRequest.status, "pending")));

    revalidatePath("/dashboard/family-requests");
    revalidatePath("/dashboard/my-family");
    return { success: true };
  } catch (error: any) {
    console.error("Reject family request error:", error);
    return { error: error.message || "حدث خطأ أثناء رفض الطلب" };
  }
}
