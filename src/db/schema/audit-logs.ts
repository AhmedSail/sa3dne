import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Audit log — an append-only record of important system actions.
 *
 * Written through the central `logAudit` service (see `src/lib/audit`). Only the
 * System Administrator can read these. Password values must never be stored
 * here; the service redacts sensitive fields before insert.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    // Actor. Nullable so the log survives if the user is later deleted, and so
    // system-initiated actions can be recorded without a user.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    oldValueJson: jsonb("old_value_json"),
    newValueJson: jsonb("new_value_json"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_user_idx").on(t.userId),
    index("audit_log_action_idx").on(t.action),
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_created_at_idx").on(t.createdAt),
  ],
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
