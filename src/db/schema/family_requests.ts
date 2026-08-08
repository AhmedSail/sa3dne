import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { family } from "./families";
import { user } from "./auth";
import { familyRequestStatus, familyRequestType } from "./enums";

/**
 * Stores pending update requests submitted by beneficiaries.
 * Actual family / family_member records are NOT modified until
 * a camp manager approves the request.
 */
export const familyUpdateRequest = pgTable("family_update_request", {
  id: text("id").primaryKey(),

  familyId: text("family_id")
    .notNull()
    .references(() => family.id, { onDelete: "cascade" }),

  requestedById: text("requested_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  type: familyRequestType("type").notNull(),

  /**
   * JSON snapshot of the proposed change.
   * Shape depends on `type`:
   *  - add_member:        { member: FamilyMemberData }
   *  - remove_member:     { memberId: string }
   *  - update_family_info:{ fields: Partial<FamilyData> }
   *  - update_member:     { memberId: string, fields: Partial<FamilyMemberData> }
   */
  payload: jsonb("payload").notNull(),

  status: familyRequestStatus("status").notNull().default("pending"),

  /** Required when status = 'rejected' */
  rejectionReason: text("rejection_reason"),

  reviewedById: text("reviewed_by_id").references(() => user.id, {
    onDelete: "set null",
  }),

  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type FamilyUpdateRequest = typeof familyUpdateRequest.$inferSelect;
export type NewFamilyUpdateRequest = typeof familyUpdateRequest.$inferInsert;
