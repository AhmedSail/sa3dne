import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Domain enums for the IDP Camp Management System.
 *
 * These are declared here for planning and reuse. A `pgEnum` only becomes part
 * of a generated migration once a table actually references it, so declaring an
 * enum up-front has no schema effect until a later phase uses it.
 */

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const campStatus = pgEnum("camp_status", ["active", "inactive", "closed"]);

export const needLevel = pgEnum("need_level", ["low", "medium", "high", "critical"]);

export const providerType = pgEnum("provider_type", [
  "organization",
  "independent_initiator",
]);

export const contributionStatus = pgEnum("contribution_status", [
  "draft",
  "submitted",
  "cancelled",
]);

export const contributionLineStatus = pgEnum("contribution_line_status", [
  "pending",
  "received",
  "partially_received",
  "not_received",
  "rejected",
]);

export const complaintType = pgEnum("complaint_type", [
  "complaint",
  "suggestion",
  "unmet_need",
]);

export const complaintStatus = pgEnum("complaint_status", [
  "pending",
  "in_review",
  "resolved",
  "rejected",
]);

export const notificationStatus = pgEnum("notification_status", ["unread", "read"]);
