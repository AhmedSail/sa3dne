import { db } from "@/db";
import { family } from "@/db/schema/families";
import type { Actor } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";

/**
 * Shared server-side access helpers for the beneficiary self-service screens.
 *
 * A beneficiary account is created with the e-mail `<nationalId>@sa3dne.local`,
 * so the account itself is what links a session to a household record. Every
 * "my family" query resolves that link here rather than trusting a national ID
 * sent in the request body — otherwise one beneficiary could read or overwrite
 * another household simply by submitting their ID number.
 */

const BENEFICIARY_EMAIL_SUFFIX = "@sa3dne.local";

/** The national ID the account is registered under, derived from the session. */
export function ownNationalId(actor: Actor): string {
  return actor.email.endsWith(BENEFICIARY_EMAIL_SUFFIX)
    ? actor.email.slice(0, -BENEFICIARY_EMAIL_SUFFIX.length)
    : actor.email;
}

/**
 * The household record belonging to the acting beneficiary, or null when they
 * have not registered one yet.
 *
 * Older accounts were stored with the full e-mail in `national_id`, so that
 * form is accepted as a fallback.
 */
export async function getOwnFamily(actor: Actor) {
  const byNationalId = await db
    .select()
    .from(family)
    .where(eq(family.nationalId, ownNationalId(actor)))
    .limit(1);
  if (byNationalId[0]) return byNationalId[0];

  const byEmail = await db
    .select()
    .from(family)
    .where(eq(family.nationalId, actor.email))
    .limit(1);
  return byEmail[0] ?? null;
}
