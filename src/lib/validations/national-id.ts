import { z } from "zod";

/**
 * National ID format.
 *
 * A Palestinian national ID is exactly nine digits. Both ends of every screen
 * that accepts one share these, so the browser and the server can never
 * disagree about what counts as valid.
 */

export const NATIONAL_ID_LENGTH = 9;

const NATIONAL_ID_PATTERN = /^\d{9}$/;

/** Translation key, so the caller can show the message in the user's language. */
export const NATIONAL_ID_ERROR = "nationalIdFormatError";

/** True when the value is exactly nine digits, ignoring surrounding spaces. */
export function isValidNationalId(value: string | null | undefined): boolean {
  return NATIONAL_ID_PATTERN.test((value ?? "").trim());
}

/**
 * Keeps only digits and cuts at nine, for use as an input's `onChange` filter:
 * a field that cannot hold a bad value never has to reject one.
 */
export function toNationalIdInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, NATIONAL_ID_LENGTH);
}

/** Required national ID — the head of household's. */
export const nationalIdSchema = z
  .string()
  .trim()
  .regex(NATIONAL_ID_PATTERN, NATIONAL_ID_ERROR);

/**
 * Optional national ID — a family member's. Children and newborns often have
 * none yet, so blank is accepted, but anything entered must be well formed.
 * Blank normalises to `null` rather than an empty string.
 */
export const optionalNationalIdSchema = z
  .union([nationalIdSchema, z.literal("")])
  .nullish()
  .transform((value) => (value ? value : null));
