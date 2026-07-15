import { integer, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contributionStatus, contributionLineStatus } from "./enums";
import { aidProvider } from "./providers";
import { camp } from "./camps";
import { aidType } from "./aid-types";
import { user } from "./auth";

/**
 * Aid contribution header.
 *
 * A provider drafts a contribution, adds one or more per-camp lines, then
 * submits it. Aid is always recorded at camp level (see the line table); the
 * header only groups the lines and tracks the draft -> submitted lifecycle.
 */
export const aidContribution = pgTable(
  "aid_contribution",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => aidProvider.id, { onDelete: "cascade" }),
    status: contributionStatus("status").notNull().default("draft"),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("aid_contribution_provider_idx").on(t.providerId)],
);

/**
 * Aid contribution line — one camp receiving one aid type.
 *
 * Planned fields are set by the provider on the draft. Actual/confirmation
 * fields are filled by the assigned Camp Manager during receipt confirmation.
 */
export const aidContributionLine = pgTable(
  "aid_contribution_line",
  {
    id: text("id").primaryKey(),
    contributionId: text("contribution_id")
      .notNull()
      .references(() => aidContribution.id, { onDelete: "cascade" }),
    campId: text("camp_id")
      .notNull()
      .references(() => camp.id, { onDelete: "restrict" }),
    aidTypeId: text("aid_type_id")
      .notNull()
      .references(() => aidType.id, { onDelete: "restrict" }),
    plannedQuantity: integer("planned_quantity").notNull(),
    unit: text("unit").notNull(),
    plannedDeliveryDate: timestamp("planned_delivery_date"),
    status: contributionLineStatus("status").notNull().default("pending"),
    actualReceivedQuantity: integer("actual_received_quantity"),
    actualReceiptDate: timestamp("actual_receipt_date"),
    confirmationNotes: text("confirmation_notes"),
    rejectionReason: text("rejection_reason"),
    confirmedById: text("confirmed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("aid_contribution_line_contribution_idx").on(t.contributionId),
    index("aid_contribution_line_camp_idx").on(t.campId),
    index("aid_contribution_line_aid_type_idx").on(t.aidTypeId),
  ],
);

export type AidContribution = typeof aidContribution.$inferSelect;
export type NewAidContribution = typeof aidContribution.$inferInsert;
export type AidContributionLine = typeof aidContributionLine.$inferSelect;
export type NewAidContributionLine = typeof aidContributionLine.$inferInsert;
