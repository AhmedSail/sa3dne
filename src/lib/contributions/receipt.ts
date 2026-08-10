import { z } from "zod";

/**
 * Receipt confirmation rules for a single aid-contribution line.
 *
 * This module is intentionally free of database and session dependencies so the
 * business rules can be unit-tested in isolation. The route handler
 * (`/api/incoming-aid/[lineId]`) is responsible for authentication, camp
 * scoping, and persistence; everything about *what a confirmation means* lives
 * here.
 *
 * Each action carries its own server-side rules, validated with Zod (never
 * trusting the client):
 *  - full:         actual = planned (derived on the server), receipt date required.
 *  - partial:      0 < actual < planned, receipt date + notes required.
 *  - complete:     tops a partially received line up to the planned quantity.
 *  - not_received: actual is forced to 0, notes required.
 *  - reject:       rejection reason required, quantity cleared.
 */
export const confirmSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("full"),
    actualReceiptDate: z.string().min(1, "Receipt date is required"),
  }),
  z.object({
    action: z.literal("partial"),
    actualReceivedQuantity: z
      .number()
      .int()
      .positive("Received quantity must be greater than zero"),
    actualReceiptDate: z.string().min(1, "Receipt date is required"),
    confirmationNotes: z.string().min(1, "Notes are required for partial receipt"),
  }),
  z.object({
    action: z.literal("complete"),
    actualReceiptDate: z.string().min(1, "Receipt date is required"),
    confirmationNotes: z.string().optional().nullable(),
  }),
  z.object({
    action: z.literal("not_received"),
    confirmationNotes: z.string().min(1, "Notes are required when not received"),
  }),
  z.object({
    action: z.literal("reject"),
    rejectionReason: z.string().min(1, "A rejection reason is required"),
  }),
]);

export type ConfirmInput = z.infer<typeof confirmSchema>;

export type LineStatus =
  | "pending"
  | "received"
  | "partially_received"
  | "not_received"
  | "rejected";

/**
 * Statuses that close a line for good. "Received" and "Rejected" are the two
 * final outcomes of the receipt workflow, so they carry no further actions.
 */
export const TERMINAL_LINE_STATUSES: readonly LineStatus[] = [
  "received",
  "rejected",
];

/**
 * Which confirmation actions a line accepts, given the status it is in now.
 *
 * A partially received line has already been confirmed once; the only thing
 * left to record is that the remaining quantity arrived, so "complete" is its
 * single action. Terminal statuses accept nothing.
 */
export function allowedActionsFor(
  status: string | undefined,
): ConfirmInput["action"][] {
  if (status && TERMINAL_LINE_STATUSES.includes(status as LineStatus)) return [];
  if (status === "partially_received") return ["complete"];
  // 'pending' and 'not_received' are still open: aid may yet turn up.
  return ["full", "partial", "not_received", "reject"];
}

/** The only part of a contribution line the receipt rules need to decide. */
export type ReceiptLineSnapshot = {
  plannedQuantity: number;
  /** Current line status; treated as 'pending' when absent. */
  status?: string | null;
};

export type ReceiptUpdate = {
  status: "received" | "partially_received" | "not_received" | "rejected";
  actualReceivedQuantity: number | null;
  actualReceiptDate: Date | null;
  confirmationNotes: string | null;
  rejectionReason: string | null;
  confirmedById: string;
  confirmedAt: Date;
  updatedAt: Date;
};

export type ReceiptDecision =
  | { ok: true; updates: ReceiptUpdate }
  | { ok: false; error: string };

/**
 * Translates a validated confirmation action into the exact column values to
 * persist, or a rule violation.
 *
 * Note that `full` derives the received quantity from the stored planned
 * quantity rather than from the request body: a client cannot inflate what was
 * received by claiming a larger number.
 */
export function buildReceiptUpdate(
  line: ReceiptLineSnapshot,
  data: ConfirmInput,
  ctx: { userId: string; now: Date },
): ReceiptDecision {
  const currentStatus = line.status ?? "pending";

  // Guard the transition before anything else: a client that keeps a stale page
  // open must not be able to re-confirm a line that is already settled.
  const allowed = allowedActionsFor(currentStatus);
  if (allowed.length === 0) {
    return {
      ok: false,
      error: "This line is already settled and cannot be confirmed again",
    };
  }
  if (!allowed.includes(data.action)) {
    return {
      ok: false,
      error: `Action '${data.action}' is not allowed for a line in status '${currentStatus}'`,
    };
  }

  const base = {
    confirmedById: ctx.userId,
    confirmedAt: ctx.now,
    updatedAt: ctx.now,
  };

  switch (data.action) {
    case "full":
      return {
        ok: true,
        updates: {
          ...base,
          status: "received",
          actualReceivedQuantity: line.plannedQuantity,
          actualReceiptDate: new Date(data.actualReceiptDate),
          confirmationNotes: null,
          rejectionReason: null,
        },
      };

    case "partial": {
      if (data.actualReceivedQuantity >= line.plannedQuantity) {
        return {
          ok: false,
          error: "Partial quantity must be less than the planned quantity",
        };
      }
      return {
        ok: true,
        updates: {
          ...base,
          status: "partially_received",
          actualReceivedQuantity: data.actualReceivedQuantity,
          actualReceiptDate: new Date(data.actualReceiptDate),
          confirmationNotes: data.confirmationNotes,
          rejectionReason: null,
        },
      };
    }

    case "complete":
      // Closing out a partial receipt: the outstanding balance arrived, so the
      // line ends up fully received at the planned quantity.
      return {
        ok: true,
        updates: {
          ...base,
          status: "received",
          actualReceivedQuantity: line.plannedQuantity,
          actualReceiptDate: new Date(data.actualReceiptDate),
          confirmationNotes: data.confirmationNotes?.trim() || null,
          rejectionReason: null,
        },
      };

    case "not_received":
      return {
        ok: true,
        updates: {
          ...base,
          status: "not_received",
          actualReceivedQuantity: 0,
          actualReceiptDate: null,
          confirmationNotes: data.confirmationNotes,
          rejectionReason: null,
        },
      };

    case "reject":
      return {
        ok: true,
        updates: {
          ...base,
          status: "rejected",
          actualReceivedQuantity: null,
          actualReceiptDate: null,
          confirmationNotes: null,
          rejectionReason: data.rejectionReason,
        },
      };
  }
}
