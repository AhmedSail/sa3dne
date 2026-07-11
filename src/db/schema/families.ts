import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { camp } from "./camps";

export const family = pgTable("family", {
  id: text("id").primaryKey(),
  campId: text("camp_id").notNull().references(() => camp.id, { onDelete: "cascade" }),
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
});

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
