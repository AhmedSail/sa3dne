import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const contactSettings = pgTable("contact_settings", {
  id: varchar("id", { length: 255 }).primaryKey(), // Always 'default'
  whatsapp: varchar("whatsapp", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  twitter: varchar("twitter", { length: 255 }),
  instagram: varchar("instagram", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  address: text("address"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
