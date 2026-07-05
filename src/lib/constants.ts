/**
 * Project-level constants and enum value lists.
 *
 * The literal arrays mirror the PostgreSQL enums declared in
 * `src/db/schema/enums.ts` so they can be reused for Zod validation, UI
 * selects, and type derivation without importing the drizzle schema everywhere.
 */

export const APP_NAME = "Unified IDP Camp Management System";

export const USER_STATUSES = ["active", "inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_ROLES = [
  "system_admin",
  "camp_manager",
  "org_representative",
  "independent_initiator",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CAMP_STATUSES = ["active", "inactive", "closed"] as const;
export type CampStatus = (typeof CAMP_STATUSES)[number];

export const NEED_LEVELS = ["low", "medium", "high", "critical"] as const;
export type NeedLevel = (typeof NEED_LEVELS)[number];

export const PROVIDER_TYPES = ["organization", "independent_initiator"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const CONTRIBUTION_STATUSES = ["draft", "submitted", "cancelled"] as const;
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];

export const CONTRIBUTION_LINE_STATUSES = [
  "pending",
  "received",
  "partially_received",
  "not_received",
  "rejected",
] as const;
export type ContributionLineStatus = (typeof CONTRIBUTION_LINE_STATUSES)[number];

export const COMPLAINT_TYPES = ["complaint", "suggestion", "unmet_need"] as const;
export type ComplaintType = (typeof COMPLAINT_TYPES)[number];

export const COMPLAINT_STATUSES = [
  "pending",
  "in_review",
  "resolved",
  "rejected",
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const NOTIFICATION_STATUSES = ["unread", "read"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/**
 * Non-negotiable business rule: aid is managed at camp level only. Families are
 * registered for statistics/population reporting, never for aid distribution.
 */
export const AID_MANAGEMENT_LEVEL = "camp" as const;
