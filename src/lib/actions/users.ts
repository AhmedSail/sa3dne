"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user, account, session } from "@/db/schema/auth";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

/**
 * Server-side outcomes are reported as translation keys rather than sentences.
 * The caller resolves them with `t(...)`, so a message reaches the user in the
 * language they picked; a raw exception message that is not a key passes
 * through the dictionary lookup unchanged.
 */

export async function createUserAction(data: { name: string, email: string, password: string, role: string, phone: string | null, campId?: string | null }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { error: "errNotAllowedToCreateUsers" };
  }

  try {
    const existing = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, data.email)
    });

    if (existing) {
      return { error: "emailAlreadyUsed" };
    }

    const userId = crypto.randomUUID();
    const hashed = await hashPassword(data.password);

    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: data.name,
        email: data.email,
        role: data.role as any,
        phone: data.phone,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (data.role === "camp_manager" && data.campId) {
        const { campAssignment } = await import("@/db/schema/camps");
        await tx.insert(campAssignment).values({
          id: crypto.randomUUID(),
          campId: data.campId,
          userId: userId,
          createdAt: new Date(),
        });
      }

      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: data.email,
        providerId: "credential",
        userId: userId,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { error: error.message || "errCreateFailed" };
  }
}

export async function banUserAction(targetUserId: string) {
  const sess = await auth.api.getSession({ headers: await headers() });
  if (!sess || (sess.user as any).role !== "admin") {
    return { error: "errNotAuthorized" };
  }
  if (sess.user.id === targetUserId) {
    return { error: "cannotBanSelf" };
  }
  try {
    // Delete all active sessions for the banned user
    await db.delete(session).where(eq(session.userId, targetUserId));
    // Mark user as banned
    await db.update(user)
      .set({ banned: true, updatedAt: new Date() })
      .where(eq(user.id, targetUserId));
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Ban user error:", error);
    return { error: error.message || "errBanFailed" };
  }
}

export async function unbanUserAction(targetUserId: string) {
  const sess = await auth.api.getSession({ headers: await headers() });
  if (!sess || (sess.user as any).role !== "admin") {
    return { error: "errNotAuthorized" };
  }
  try {
    await db.update(user)
      .set({ banned: false, banReason: null, updatedAt: new Date() })
      .where(eq(user.id, targetUserId));
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Unban user error:", error);
    return { error: error.message || "errUnbanFailed" };
  }
}

