import { integer, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { camp } from "./camps";
import { aidType } from "./aid-types";
import { aidProvider } from "./providers";
import { user } from "./auth";

/**
 * Aid Request — a camp manager signals a specific need to all providers.
 *
 * Providers can respond with partial commitments. The fulfilledQuantity is
 * incremented on each response. Once fulfilledQuantity >= requestedQuantity
 * the status transitions to "fulfilled".
 *
 * Rule: a camp may only have ONE open/in_progress request per day.
 */
export const aidRequest = pgTable(
  "aid_request",
  {
    id: text("id").primaryKey(),
    campId: text("camp_id")
      .notNull()
      .references(() => camp.id, { onDelete: "cascade" }),
    aidTypeId: text("aid_type_id")
      .notNull()
      .references(() => aidType.id, { onDelete: "restrict" }),
    requestedQuantity: integer("requested_quantity").notNull(),
    fulfilledQuantity: integer("fulfilled_quantity").notNull().default(0),
    unit: text("unit").notNull(),
    urgencyLevel: text("urgency_level").notNull().default("medium"), // low | medium | high | critical
    notes: text("notes"),
    status: text("status").notNull().default("open"), // open | in_progress | fulfilled | cancelled
    requestedById: text("requested_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("aid_request_camp_idx").on(t.campId),
    index("aid_request_status_idx").on(t.status),
  ]
);

/**
 * Aid Request Response — a provider's commitment to fulfil part of a request.
 *
 * Multiple providers can respond to the same request, each committing to
 * a different slice of the total quantity.
 */
export const aidRequestResponse = pgTable(
  "aid_request_response",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => aidRequest.id, { onDelete: "cascade" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => aidProvider.id, { onDelete: "cascade" }),
    committedQuantity: integer("committed_quantity").notNull(),
    notes: text("notes"),
    status: text("status").notNull().default("committed"), // committed | cancelled
    respondedById: text("responded_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("aid_request_response_request_idx").on(t.requestId),
    index("aid_request_response_provider_idx").on(t.providerId),
  ]
);

export type AidRequest = typeof aidRequest.$inferSelect;
export type NewAidRequest = typeof aidRequest.$inferInsert;
export type AidRequestResponse = typeof aidRequestResponse.$inferSelect;
export type NewAidRequestResponse = typeof aidRequestResponse.$inferInsert;
