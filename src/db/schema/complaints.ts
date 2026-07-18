import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { camp } from "./camps";
import { user } from "./auth";
import { complaintType, complaintStatus } from "./enums";

export const complaints = pgTable("complaints", {
  id: text("id").primaryKey(),
  trackingNumber: text("tracking_number").notNull().unique(),
  campId: text("camp_id")
    .notNull()
    .references(() => camp.id, { onDelete: "cascade" }),
  type: complaintType("type").notNull(),
  beneficiaryName: text("beneficiary_name").notNull(),
  phone: text("phone"),
  details: text("details").notNull(),
  status: complaintStatus("status").default("pending").notNull(),
  resolutionNotes: text("resolution_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedById: text("reviewed_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;
