import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { notificationStatus } from "./enums";
import { user } from "./auth";

/**
 * In-app notification for an authenticated user.
 *
 * Created by the notification service when a contribution is submitted (to the
 * assigned Camp Managers, or the Admin fallback) and when a receipt status
 * changes (to the owning provider). Notifications respect scope: a user only
 * ever sees rows addressed to their own `userId`.
 */
export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    link: text("link"),
    status: notificationStatus("status").notNull().default("unread"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    readAt: timestamp("read_at"),
  },
  (t) => [
    index("notification_user_idx").on(t.userId),
    index("notification_user_status_idx").on(t.userId, t.status),
    index("notification_created_at_idx").on(t.createdAt),
  ],
);

export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
