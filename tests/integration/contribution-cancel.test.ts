import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

// Audit and notification writes are best-effort side effects; silencing them
// keeps the queued results aligned with the authorization path under test.
vi.mock("@/lib/audit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/audit")>()),
  logAudit: async () => {},
}));
vi.mock("@/lib/notifications/service", () => ({
  notifyOfContributionCancellation: async () => {},
}));

const { POST: CANCEL } = await import("@/app/api/contributions/[id]/cancel/route");

/**
 * IT-CAN-*: withdrawing a submitted contribution.
 *
 * A provider may take back a promise nobody has acted on yet. The moment a Camp
 * Manager records what arrived, that receipt is history: these cover who may
 * cancel and the exact window in which cancelling is still allowed.
 */

const CONTRIBUTION_ID = "contribution-1";
const PROVIDER_ID = "provider-1";

const cancel = () =>
  CANCEL(
    new NextRequest(
      `http://localhost:3000/api/contributions/${CONTRIBUTION_ID}/cancel`,
      { method: "POST" },
    ),
    { params: Promise.resolve({ id: CONTRIBUTION_ID }) },
  );

const submitted = (status = "submitted") => [
  { id: CONTRIBUTION_ID, providerId: PROVIDER_ID, status },
];

const ownProvider = [{ id: PROVIDER_ID, status: "active" }];

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("who may cancel (IT-CAN)", () => {
  it("IT-CAN-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await cancel();

    expect(response.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-CAN-02: a role with no contribution access is refused before any read", async () => {
    for (const role of ["user", "beneficiary"] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await cancel();

      expect(response.status, `role ${role}`).toBe(403);
      expect(dbMock.chains, `role ${role}`).toHaveLength(0);
    }
  });

  it("IT-CAN-03: a provider cannot cancel another provider's contribution", async () => {
    authMock.signInAs("org_representative");
    dbMock.queue(
      submitted(),
      [{ id: "provider-other", status: "active" }], // caller's own profile
    );

    const response = await cancel();

    expect(response.status).toBe(403);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CAN-04: an account with no provider profile cannot cancel", async () => {
    authMock.signInAs("independent_initiator");
    dbMock.queue(submitted(), []); // no provider profile

    const response = await cancel();

    expect(response.status).toBe(403);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CAN-05: the owning provider cancels its own contribution", async () => {
    authMock.signInAs("org_representative");
    dbMock.queue(submitted(), ownProvider, [
      { status: "pending" },
      { status: "pending" },
    ]);

    const response = await cancel();

    expect(response.status).toBe(200);
    expect(dbMock.firstArgOf("update", "set")).toMatchObject({
      status: "cancelled",
    });
  });
});

describe("the cancellation window (IT-CAN)", () => {
  beforeEach(() => authMock.signInAs("org_representative"));

  it("IT-CAN-06: a contribution with a confirmed line can no longer be cancelled", async () => {
    dbMock.queue(submitted(), ownProvider, [
      { status: "pending" },
      { status: "received" },
    ]);

    const response = await cancel();

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CAN-07: a rejected line also closes the window", async () => {
    // The camp answered — that answer is part of the record.
    dbMock.queue(submitted(), ownProvider, [{ status: "rejected" }]);

    const response = await cancel();

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CAN-08: a draft is not cancellable through this route", async () => {
    dbMock.queue(submitted("draft"), ownProvider, [{ status: "pending" }]);

    const response = await cancel();

    expect(response.status).toBe(409);
  });

  it("IT-CAN-09: cancelling twice is refused the second time", async () => {
    dbMock.queue(submitted("cancelled"), ownProvider, [{ status: "pending" }]);

    const response = await cancel();

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CAN-10: a missing contribution returns 404", async () => {
    dbMock.queue([]);

    const response = await cancel();

    expect(response.status).toBe(404);
  });
});
