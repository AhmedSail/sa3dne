/**
 * Drizzle schema barrel.
 *
 * Re-exports every table and enum so `import * as schema from "@/db/schema"`
 * gives the drizzle client and better-auth adapter the full schema.
 */
export * from "./enums";
export * from "./auth";
export * from "./camps";
export * from "./families";
export * from "./aid-types";
export * from "./providers";
export * from "./contributions";
export * from "./complaints";
export * from "./audit-logs";
export * from "./notifications";
