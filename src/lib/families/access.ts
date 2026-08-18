import { db } from "@/db";
import { family } from "@/db/schema/families";
import type { Actor } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";

/**
 * Shared server-side access helpers for the beneficiary self-service screens.
 *
 * A household is joined to the account of its head by `family.user_id`, a
 * unique foreign key. Every "my family" query resolves that link here rather
 * than trusting a national ID sent in the request body — otherwise one
 * beneficiary could read or overwrite another household by submitting their ID
 * number.
 */

/**
 * The household belonging to the acting beneficiary, or null when no household
 * has been registered against their account.
 */
export async function getOwnFamily(actor: Actor) {
  const rows = await db
    .select()
    .from(family)
    .where(eq(family.userId, actor.id))
    .limit(1);
  return rows[0] ?? null;
}
