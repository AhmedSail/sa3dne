"use server";

import { db } from "@/db";
import { contactSettings } from "@/db/schema/settings";
import { auth } from "@/lib/auth/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { contactSettingsSchema } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuditAction, logAudit } from "@/lib/audit";

export async function getContactSettings() {
  const result = await db.query.contactSettings.findFirst({
    where: eq(contactSettings.id, "default"),
  });
  
  if (!result) {
    return {
      id: "default",
      whatsapp: null,
      email: null,
      phone: null,
      facebook: null,
      twitter: null,
      instagram: null,
      linkedin: null,
      address: null,
    };
  }
  return result;
}

export async function updateContactSettings(data: z.infer<typeof contactSettingsSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    return { error: "غير مصرح لك بتحديث الإعدادات" };
  }

  const parsed = contactSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "بيانات الإعدادات غير صالحة" };
  }

  try {
    const existing = await db.query.contactSettings.findFirst({
      where: eq(contactSettings.id, "default"),
    });

    if (existing) {
      await db.update(contactSettings)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(contactSettings.id, "default"));
    } else {
      await db.insert(contactSettings).values({
        id: "default",
        ...parsed.data,
      });
    }

    await logAudit({
      userId: session.user.id,
      action: "settings.update",
      entityType: "contact_settings",
      entityId: "default",
      newValue: parsed.data
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/feedback");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error updating contact settings:", error);
    return { error: "حدث خطأ أثناء حفظ الإعدادات" };
  }
}
