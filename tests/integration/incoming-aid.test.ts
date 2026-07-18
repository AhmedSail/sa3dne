import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authMock } from "../helpers/auth-mock";
import { dbMock } from "../helpers/db-mock";

vi.mock("@/db", async () => {
  const { dbMock } = await import("../helpers/db-mock");
  return { db: dbMock.db };
});

vi.mock("@/lib/auth", async () => {
  const { authMock } = await import("../helpers/auth-mock");
  return { auth: authMock.auth };
});

const { PATCH } = await import("@/app/api/incoming-aid/[lineId]/route");

/**
 * IT-RCP-*: Receipt confirmation endpoint — PATCH /api/incoming-aid/[lineId].
 *
 * This is the phase 03 acceptance path: a Camp Manager confirming what actually
 * arrived at their camp. The unit tests in `tests/unit/receipt-rules.test.ts`
 * cover *what a confirmation means*; these cover *who is allowed to make one
 * and when* — the server-side authorization that must never depend on a hidden
 * frontend button.
 */

const LINE_ID = "line-1";
const CAMP_A = "camp-a";
const CAMP_B = "camp-b";

/** A submitted line at camp A, planned 100 units. */
const submittedLine = (campId = CAMP_A) => ({
  line: {
    id: LINE_ID,
    campId,
    contributionId: "contribution-1",
    plannedQuantity: 100,
    status: "pending",
  },
  contributionStatus: "submitted",
});

const patch = (body: unknown) =>
  PATCH(
    new NextRequest(`http://localhost:3000/api/incoming-aid/${LINE_ID}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ lineId: LINE_ID }) },
  );

const fullReceipt = { action: "full", actualReceiptDate: "2026-03-01" };

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

afterEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("authentication and role scoping (IT-RCP)", () => {
  it("IT-RCP-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await patch(fullReceipt);

    expect(response.status).toBe(401);
    // Nothing must be written, and no data read, for an unauthenticated caller.
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-RCP-02: a provider cannot confirm receipt of aid", async () => {
    // Separation of duties: the provider promises the aid, the camp confirms it.
    authMock.signInAs("org_representative");
    dbMock.queue([submittedLine()]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(403);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-03: a beneficiary cannot confirm receipt of aid", async () => {
    authMock.signInAs("beneficiary");
    dbMock.queue([submittedLine()]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(403);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-04: a Camp Manager cannot confirm a line for a camp they are not assigned to", async () => {
    // The core tenancy rule: a manager sees only their own camps.
    authMock.signInAs("camp_manager", "cm-1");
    dbMock.queue(
      [submittedLine(CAMP_B)], // the line belongs to camp B...
      [{ campId: CAMP_A }], // ...but this manager is assigned to camp A only
    );

    const response = await patch(fullReceipt);

    expect(response.status).toBe(403);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-05: a Camp Manager with no camp assignment at all is refused", async () => {
    authMock.signInAs("camp_manager", "cm-unassigned");
    dbMock.queue([submittedLine(CAMP_A)], []);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(403);
  });

  it("IT-RCP-06: a Camp Manager can confirm a line for a camp they are assigned to", async () => {
    authMock.signInAs("camp_manager", "cm-1");
    dbMock.queue([submittedLine(CAMP_A)], [{ campId: CAMP_A }, { campId: CAMP_B }]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      status: "received",
    });
  });

  it("IT-RCP-07: an administrator can confirm any line without a camp assignment", async () => {
    authMock.signInAs("admin");
    dbMock.queue([submittedLine(CAMP_B)]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(200);
  });

  it("IT-RCP-08: a missing line returns 404", async () => {
    authMock.signInAs("admin");
    dbMock.queue([]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(404);
  });
});

describe("contribution status gate (IT-RCP)", () => {
  it("IT-RCP-09: a line on a draft contribution cannot be confirmed", async () => {
    // A draft has not been promised to anyone yet, so there is nothing to receive.
    authMock.signInAs("admin");
    dbMock.queue([
      { line: submittedLine().line, contributionStatus: "draft" },
    ]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-10: a line on a cancelled contribution cannot be confirmed", async () => {
    authMock.signInAs("admin");
    dbMock.queue([
      { line: submittedLine().line, contributionStatus: "cancelled" },
    ]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(409);
  });
});

describe("confirmation actions persisted (IT-RCP)", () => {
  beforeEach(() => {
    authMock.signInAs("camp_manager", "cm-1");
  });

  it("IT-RCP-11: a full receipt stores the planned quantity and the confirming user", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch(fullReceipt);

    expect(response.status).toBe(200);
    expect(dbMock.firstArgOf("update", "set")).toMatchObject({
      status: "received",
      actualReceivedQuantity: 100,
      confirmedById: "cm-1",
      rejectionReason: null,
    });
  });

  it("IT-RCP-12: a partial receipt stores the reported quantity and notes", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({
      action: "partial",
      actualReceivedQuantity: 70,
      actualReceiptDate: "2026-03-01",
      confirmationNotes: "30 units short",
    });

    expect(response.status).toBe(200);
    expect(dbMock.firstArgOf("update", "set")).toMatchObject({
      status: "partially_received",
      actualReceivedQuantity: 70,
      confirmationNotes: "30 units short",
    });
  });

  it("IT-RCP-13: a partial receipt of the full planned quantity is rejected with 400", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({
      action: "partial",
      actualReceivedQuantity: 100,
      actualReceiptDate: "2026-03-01",
      confirmationNotes: "all of it",
    });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-14: a rejection without a reason is refused with 400", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({ action: "reject", rejectionReason: "" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-15: a rejection with a reason is stored and clears the quantity", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({
      action: "reject",
      rejectionReason: "Goods spoiled in transit",
    });

    expect(response.status).toBe(200);
    expect(dbMock.firstArgOf("update", "set")).toMatchObject({
      status: "rejected",
      actualReceivedQuantity: null,
      rejectionReason: "Goods spoiled in transit",
    });
  });

  it("IT-RCP-16: 'not received' without notes is refused with 400", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({ action: "not_received" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-RCP-17: a client cannot inflate a full receipt beyond the planned quantity", async () => {
    // Never trust the client: the quantity is derived on the server.
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({
      action: "full",
      actualReceiptDate: "2026-03-01",
      actualReceivedQuantity: 999_999,
    });

    expect(response.status).toBe(200);
    expect(dbMock.firstArgOf("update", "set")).toMatchObject({
      actualReceivedQuantity: 100,
    });
  });

  it("IT-RCP-18: an unknown action is refused with 400", async () => {
    dbMock.queue([submittedLine()], [{ campId: CAMP_A }]);

    const response = await patch({ action: "approve_everything" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });
});
