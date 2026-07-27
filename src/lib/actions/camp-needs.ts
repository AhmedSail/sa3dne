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
  if (role !== "admin") {
    return { error: "غير مصرح" };
  }

  try {

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
