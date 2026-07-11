import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { campStatus, needLevel, gazaGovernorate } from "./enums";
import { user } from "./auth";

export const camp = pgTable("camp", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: gazaGovernorate("location").notNull().default("gaza_city"),
  capacity: integer("capacity").notNull(),
  operationalStatus: campStatus("operational_status").notNull().default("active"),
  needLevel: needLevel("need_level").notNull().default("low"),
  notes: text("notes"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const campAssignment = pgTable("camp_assignment", {
  id: text("id").primaryKey(),
  campId: text("camp_id").notNull().references(() => camp.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
