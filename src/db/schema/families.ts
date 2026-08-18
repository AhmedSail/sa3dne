import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { camp } from "./camps";
import { user } from "./auth";

export const family = pgTable("family", {
  id: text("id").primaryKey(),
  campId: text("camp_id").notNull().references(() => camp.id, { onDelete: "cascade" }),
  // The account of the head of household, one per family. Nullable so a
  // household keeps its population statistics if the account is deleted;
  // unique so no two families can claim the same account.
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  headName: text("head_name").notNull(),
  nationalId: text("national_id").notNull(), // Unique for active families
  phone: text("phone"),
  memberCount: integer("member_count").notNull(),
  occupation: text("occupation"), // New field
  notes: text("notes"),
  status: text("status").notNull().default("active"), // active, inactive
  inactiveReason: text("inactive_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("family_user_id_unique_idx").on(t.userId)]);

export const familyMember = pgTable("family_member", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull().references(() => family.id, { onDelete: "cascade" }),
  nationalId: text("national_id"),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // wife, son, daughter, other
  educationLevel: text("education_level").notNull(), // none, elementary, preparatory, secondary, university, post_graduate
  gender: text("gender").notNull().default("male"), // male, female
  birthDate: timestamp("birth_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
