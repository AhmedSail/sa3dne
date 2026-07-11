import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const aidType = pgTable("aid_type", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Unique for active types
  category: text("category").notNull(),
  defaultUnit: text("default_unit").notNull(),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
