import { describe, expect, it } from "vitest";
import {
  allowedActionsFor,
  buildReceiptUpdate,
  confirmSchema,
  type ConfirmInput,
} from "@/lib/contributions/receipt";

/**
 * UT-RCP-*: Receipt confirmation business rules.
 *
 * Covers phase 03 acceptance criteria around confirming a camp-level aid line:
 * the four confirmation actions, their mandatory fields, and the quantity
 * invariants that must hold regardless of what the client sends.
 */

const CTX = { userId: "user-cm-1", now: new Date("2026-03-01T10:00:00.000Z") };
const LINE = { plannedQuantity: 100 };

const parse = (input: unknown) => confirmSchema.safeParse(input);

describe("confirmSchema (UT-RCP validation)", () => {
  it("UT-RCP-01: accepts a full receipt with a receipt date", () => {
    const result = parse({ action: "full", actualReceiptDate: "2026-03-01" });
    expect(result.success).toBe(true);
  });

  it("UT-RCP-02: rejects a full receipt with no receipt date", () => {
    const result = parse({ action: "full", actualReceiptDate: "" });
    expect(result.success).toBe(false);
  });

  it("UT-RCP-03: rejects a partial receipt with no notes", () => {
    const result = parse({
      action: "partial",
      actualReceivedQuantity: 40,
      actualReceiptDate: "2026-03-01",
      confirmationNotes: "",
    });
    expect(result.success).toBe(false);
  });

  it("UT-RCP-04: rejects a partial receipt with a zero or negative quantity", () => {
    for (const quantity of [0, -5]) {
      const result = parse({
        action: "partial",
        actualReceivedQuantity: quantity,
        actualReceiptDate: "2026-03-01",
        confirmationNotes: "Short delivery",
      });
      expect(result.success).toBe(false);
    }
  });

  it("UT-RCP-05: rejects a partial receipt with a fractional quantity", () => {
    const result = parse({
      action: "partial",
      actualReceivedQuantity: 12.5,
      actualReceiptDate: "2026-03-01",
      confirmationNotes: "Short delivery",
    });
    expect(result.success).toBe(false);
  });

  it("UT-RCP-06: rejects 'not received' with no notes", () => {
    expect(parse({ action: "not_received", confirmationNotes: "" }).success).toBe(false);
    expect(parse({ action: "not_received" }).success).toBe(false);
  });

  it("UT-RCP-07: rejects a rejection with no reason", () => {
    expect(parse({ action: "reject", rejectionReason: "" }).success).toBe(false);
    expect(parse({ action: "reject" }).success).toBe(false);
  });

  it("UT-RCP-08: rejects an unknown action", () => {
    expect(parse({ action: "approve_everything" }).success).toBe(false);
  });
});

describe("buildReceiptUpdate (UT-RCP rules)", () => {
  it("UT-RCP-09: a full receipt derives the quantity from the planned quantity", () => {
    const decision = buildReceiptUpdate(
      LINE,
      { action: "full", actualReceiptDate: "2026-03-01" },
      CTX,
    );

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.updates.status).toBe("received");
    expect(decision.updates.actualReceivedQuantity).toBe(100);
    expect(decision.updates.rejectionReason).toBeNull();
  });

  it("UT-RCP-10: a full receipt ignores any quantity supplied by the client", () => {
    // The client cannot inflate what was received: the schema strips the field
    // and the rule reads the stored planned quantity instead.
    const body = {
      action: "full",
      actualReceiptDate: "2026-03-01",
      actualReceivedQuantity: 999_999,
    };
    const parsed = confirmSchema.parse(body);
    const decision = buildReceiptUpdate(LINE, parsed, CTX);

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.updates.actualReceivedQuantity).toBe(100);
  });

  it("UT-RCP-11: a partial receipt below the planned quantity is accepted", () => {
    const decision = buildReceiptUpdate(
      LINE,
      {
        action: "partial",
        actualReceivedQuantity: 60,
        actualReceiptDate: "2026-03-01",
        confirmationNotes: "40 units missing",
      },
      CTX,
    );

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.updates.status).toBe("partially_received");
    expect(decision.updates.actualReceivedQuantity).toBe(60);
    expect(decision.updates.confirmationNotes).toBe("40 units missing");
  });

  it("UT-RCP-12: a partial receipt equal to the planned quantity is refused", () => {
    // Boundary: 'partial' must mean strictly less than planned, otherwise it is
    // a full receipt and must be recorded as one.
    const decision = buildReceiptUpdate(
      LINE,
      {
        action: "partial",
        actualReceivedQuantity: 100,
        actualReceiptDate: "2026-03-01",
        confirmationNotes: "All of it",
      },
      CTX,
    );

    expect(decision.ok).toBe(false);
    if (decision.ok) return;
    expect(decision.error).toMatch(/less than the planned quantity/i);
  });

  it("UT-RCP-13: a partial receipt above the planned quantity is refused", () => {
    const decision = buildReceiptUpdate(
      LINE,
      {
        action: "partial",
        actualReceivedQuantity: 101,
        actualReceiptDate: "2026-03-01",
        confirmationNotes: "More than promised",
      },
      CTX,
    );

    expect(decision.ok).toBe(false);
  });

  it("UT-RCP-14: 'not received' forces the quantity to zero and clears the date", () => {
    const decision = buildReceiptUpdate(
      LINE,
      { action: "not_received", confirmationNotes: "Convoy never arrived" },
      CTX,
    );

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.updates.status).toBe("not_received");
    expect(decision.updates.actualReceivedQuantity).toBe(0);
    expect(decision.updates.actualReceiptDate).toBeNull();
    expect(decision.updates.confirmationNotes).toBe("Convoy never arrived");
  });

  it("UT-RCP-15: a rejection clears the quantity and stores the reason", () => {
    const decision = buildReceiptUpdate(
      LINE,
      { action: "reject", rejectionReason: "Goods spoiled in transit" },
      CTX,
    );

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.updates.status).toBe("rejected");
    expect(decision.updates.actualReceivedQuantity).toBeNull();
    expect(decision.updates.actualReceiptDate).toBeNull();
    expect(decision.updates.rejectionReason).toBe("Goods spoiled in transit");
    expect(decision.updates.confirmationNotes).toBeNull();
  });

  it("UT-RCP-16: every successful action stamps who confirmed it and when", () => {
    const actions: ConfirmInput[] = [
      { action: "full", actualReceiptDate: "2026-03-01" },
      {
        action: "partial",
        actualReceivedQuantity: 10,
        actualReceiptDate: "2026-03-01",
        confirmationNotes: "partial",
      },
      { action: "not_received", confirmationNotes: "nothing arrived" },
      { action: "reject", rejectionReason: "spoiled" },
    ];

    for (const action of actions) {
      const decision = buildReceiptUpdate(LINE, action, CTX);
      expect(decision.ok).toBe(true);
      if (!decision.ok) continue;
      expect(decision.updates.confirmedById).toBe("user-cm-1");
      expect(decision.updates.confirmedAt).toEqual(CTX.now);
      expect(decision.updates.updatedAt).toEqual(CTX.now);
    }
  });

  it("UT-RCP-18: completing a partial receipt tops the line up to the planned quantity", () => {
    const decision = buildReceiptUpdate(
      { plannedQuantity: 100, status: "partially_received" },
      {
        action: "complete",
        actualReceiptDate: "2026-03-05",
        confirmationNotes: "the remaining 40 units arrived",
      },
      CTX,
    );

    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.updates.status).toBe("received");
    expect(decision.updates.actualReceivedQuantity).toBe(100);
    expect(decision.updates.actualReceiptDate).toEqual(new Date("2026-03-05"));
    expect(decision.updates.rejectionReason).toBeNull();
  });

  it("UT-RCP-19: 'complete' is refused on a line that was never partially received", () => {
    for (const status of ["pending", "not_received"]) {
      const decision = buildReceiptUpdate(
        { plannedQuantity: 100, status },
        { action: "complete", actualReceiptDate: "2026-03-05" },
        CTX,
      );

      expect(decision.ok).toBe(false);
    }
  });

  it("UT-RCP-20: a partially received line accepts nothing but 'complete'", () => {
    const rejected: ConfirmInput[] = [
      { action: "full", actualReceiptDate: "2026-03-05" },
      {
        action: "partial",
        actualReceivedQuantity: 80,
        actualReceiptDate: "2026-03-05",
        confirmationNotes: "more arrived",
      },
      { action: "not_received", confirmationNotes: "nothing arrived" },
      { action: "reject", rejectionReason: "spoiled" },
    ];

    for (const action of rejected) {
      const decision = buildReceiptUpdate(
        { plannedQuantity: 100, status: "partially_received" },
        action,
        CTX,
      );
      expect(decision.ok).toBe(false);
    }
  });

  it("UT-RCP-21: a settled line refuses every action", () => {
    for (const status of ["received", "rejected"]) {
      const decision = buildReceiptUpdate(
        { plannedQuantity: 100, status },
        { action: "full", actualReceiptDate: "2026-03-05" },
        CTX,
      );

      expect(decision.ok).toBe(false);
      if (decision.ok) continue;
      expect(decision.error).toMatch(/already settled/i);
    }
  });

  it("UT-RCP-22: allowedActionsFor mirrors the rules the builder enforces", () => {
    expect(allowedActionsFor("pending")).toEqual([
      "full",
      "partial",
      "not_received",
      "reject",
    ]);
    expect(allowedActionsFor("not_received")).toEqual([
      "full",
      "partial",
      "not_received",
      "reject",
    ]);
    expect(allowedActionsFor("partially_received")).toEqual(["complete"]);
    expect(allowedActionsFor("received")).toEqual([]);
    expect(allowedActionsFor("rejected")).toEqual([]);
    // A line with no status yet behaves like a pending one.
    expect(allowedActionsFor(undefined)).toEqual([
      "full",
      "partial",
      "not_received",
      "reject",
    ]);
  });

  it("UT-RCP-17: a partial receipt on a single-unit line is impossible", () => {
    // Boundary: with plannedQuantity = 1 there is no valid partial quantity,
    // because the schema already forbids 0 and the rule forbids >= 1.
    const decision = buildReceiptUpdate(
      { plannedQuantity: 1 },
      {
        action: "partial",
        actualReceivedQuantity: 1,
        actualReceiptDate: "2026-03-01",
        confirmationNotes: "the only unit",
      },
      CTX,
    );

    expect(decision.ok).toBe(false);
  });
});
