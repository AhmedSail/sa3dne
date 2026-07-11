import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { providerType } from "./enums";
import { user } from "./auth";

export const aidProvider = pgTable("aid_provider", {
  id: text("id").primaryKey(),
  type: providerType("type").notNull(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  linkedUserId: text("linked_user_id").references(() => user.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
