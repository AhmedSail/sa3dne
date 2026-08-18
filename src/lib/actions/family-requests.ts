"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { guardAction, isWithinCampScope } from "@/lib/auth/guard";
import { getOwnFamily } from "@/lib/families/access";
import { notifyReviewersOfFamilyRequest } from "@/lib/notifications/service";
import { familyUpdateRequest } from "@/db/schema/family_requests";
import { family, familyMember } from "@/db/schema/families";
import { eq, and, desc } from "drizzle-orm";

export async function submitUpdateFamilyRequest(data: {
  familyId: string;
  type: "add_member" | "remove_member" | "update_family_info" | "update_member";
  payload: any;
}) {
  const guard = await guardAction("family", "manage_own");
  if (!guard.ok) return { error: guard.error };

  // The household is resolved from the session; a `familyId` naming somebody
  // else's family is refused rather than queued for a reviewer to approve.
  const ownFamily = await getOwnFamily(guard.actor);
  if (!ownFamily || ownFamily.id !== data.familyId) {
    return { error: "errNotAuthorized" };
  }

  try {
    // Restrict to 1 pending request per family to prevent conflicting updates
    const existingPending = await db.query.familyUpdateRequest.findFirst({
      where: (req, { eq, and }) =>
        and(eq(req.familyId, data.familyId), eq(req.status, "pending")),
    });

    if (existingPending) {
      return {
        error: "errPendingRequestExists",
      };
    }

    // A "no-op" update request would only waste a reviewer's time, so the
    // server refuses it too rather than trusting the disabled submit button.
    if (data.type === "update_family_info") {
      const current = await db.query.family.findFirst({
        where: eq(family.id, data.familyId),
      });
      if (!current) {
        return { error: "errFamilyNotFound" };
      }

      const fields = (data.payload?.fields ?? {}) as Record<string, unknown>;
      const normalize = (value: unknown) => String(value ?? "").trim();
      const hasChanges = Object.keys(fields).some(
        (key) =>
          normalize(fields[key]) !==
          normalize((current as Record<string, unknown>)[key]),
      );

      if (!hasChanges) {
        return {
          error: "errNoChangesToSubmit",
        };
      }
    }

    const requestId = crypto.randomUUID();
    await db.insert(familyUpdateRequest).values({
      id: requestId,
      familyId: data.familyId,
      requestedById: guard.actor.id,
      type: data.type,
      payload: data.payload,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Best-effort: a notification failure must not fail the submission.
    await notifyReviewersOfFamilyRequest(requestId);

    revalidatePath("/dashboard/my-family");
    revalidatePath("/dashboard/family-requests");
    return { success: true };
  } catch (error: any) {
    console.error("Submit family update request error:", error);
    return { error: error.message || "errSubmitRequestFailed" };
  }
}

export async function approveFamilyRequest(requestId: string) {
  const guard = await guardAction("family", "update");
  if (!guard.ok) return { error: guard.error };

  try {
    const request = await db.query.familyUpdateRequest.findFirst({
      where: (req, { eq }) => eq(req.id, requestId),
    });

    if (!request || request.status !== "pending") {
      return { error: "errRequestNotFoundOrProcessed" };
    }

    // The list view is already scoped, but the action must not depend on that:
    // a manager may only review requests for families in their own camps.
    const target = await db.query.family.findFirst({
      where: eq(family.id, request.familyId),
    });
    if (!target || !isWithinCampScope(guard.campIds, target.campId)) {
      return { error: "errNotAuthorized" };
    }

    await db.transaction(async (tx) => {
      // 1. Update status
      await tx
        .update(familyUpdateRequest)
        .set({
          status: "approved",
          reviewedById: guard.actor.id,
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
    return { error: error.message || "errApproveFailed" };
  }
}

export async function rejectFamilyRequest(requestId: string, reason: string) {
  const guard = await guardAction("family", "update");
  if (!guard.ok) return { error: guard.error };

  if (!reason || reason.trim() === "") {
    return { error: "errRejectionReasonRequired" };
  }

  try {
    const request = await db.query.familyUpdateRequest.findFirst({
      where: (req, { eq }) => eq(req.id, requestId),
    });
    if (!request || request.status !== "pending") {
      return { error: "errRequestNotFoundOrProcessed" };
    }

    const target = await db.query.family.findFirst({
      where: eq(family.id, request.familyId),
    });
    if (!target || !isWithinCampScope(guard.campIds, target.campId)) {
      return { error: "errNotAuthorized" };
    }

    await db
      .update(familyUpdateRequest)
      .set({
        status: "rejected",
        rejectionReason: reason,
        reviewedById: guard.actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(familyUpdateRequest.id, requestId), eq(familyUpdateRequest.status, "pending")));

    revalidatePath("/dashboard/family-requests");
    revalidatePath("/dashboard/my-family");
    return { success: true };
  } catch (error: any) {
    console.error("Reject family request error:", error);
    return { error: error.message || "errRejectFailed" };
  }
}
