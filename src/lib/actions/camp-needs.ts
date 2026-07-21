"use server";

import { db } from "@/db";
import { camp } from "@/db/schema";
import { campAssignment } from "@/db/schema/camps";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { AuditAction, logAudit } from "@/lib/audit";

export async function updateCampNeedLevel(campId: string, newLevel: "low" | "medium" | "high" | "critical") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "غير مصرح" };

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "camp_manager") {
    return { error: "غير مصرح" };
  }

  try {
    if (role === "camp_manager") {
      const assignments = await db.query.campAssignment.findMany({
        where: eq(campAssignment.userId, session.user.id),
      });
      const campIds = assignments.map(a => a.campId);
      if (!campIds.includes(campId)) {
        return { error: "غير مصرح لك بتعديل هذا المخيم" };
      }
    }

    const [existing] = await db
      .select({ needLevel: camp.needLevel })
      .from(camp)
      .where(eq(camp.id, campId))
      .limit(1);

    if (!existing) return { error: "المخيم غير موجود" };

    await db.update(camp).set({ needLevel: newLevel }).where(eq(camp.id, campId));

    await logAudit({
      userId: session.user.id,
      action: AuditAction.NEED_LEVEL_CHANGE,
      entityType: "camp",
      entityId: campId,
      oldValue: { needLevel: existing.needLevel },
      newValue: { needLevel: newLevel },
      request: { headers: await headers() },
    });

    revalidatePath("/dashboard/camp-needs");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء التحديث" };
  }
}
