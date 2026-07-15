import { db } from "@/db";
import { aidProvider, campAssignment } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Shared server-side access helpers for the aid-contribution workflow.
 *
 * Every protected contribution query/mutation resolves the acting user's
 * provider profile (for provider-side actions) or assigned camps (for
 * Camp-Manager receipt confirmation) through these helpers, so authorization
 * is enforced on the server and never through hidden frontend buttons.
 */

/** Returns the active provider profile linked to a user, or null. */
export async function getActiveProviderForUser(userId: string) {
  const rows = await db
    .select()
    .from(aidProvider)
    .where(
      and(eq(aidProvider.linkedUserId, userId), eq(aidProvider.status, "active")),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Returns the set of camp ids a Camp Manager is assigned to. */
export async function getAssignedCampIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ campId: campAssignment.campId })
    .from(campAssignment)
    .where(eq(campAssignment.userId, userId));
  return rows.map((r) => r.campId);
}
