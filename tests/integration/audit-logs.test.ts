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

const { GET } = await import("@/app/api/audit-logs/route");

/**
 * IT-AUD-*: Audit log endpoint — GET /api/audit-logs.
 *
 * Phase 06 rule: only the System Administrator may read audit logs, and the
 * gate must be enforced server-side. These tests exercise that boundary
 * directly, independent of any hidden frontend navigation.
 */

const get = (query = "") =>
  GET(new NextRequest(`http://localhost:3000/api/audit-logs${query}`));

const sampleRow = {
  id: "log-1",
  userId: "user-admin",
  userName: "Admin",
  userEmail: "admin@example.com",
  action: "contribution.submit",
  entityType: "contribution",
  entityId: "c-1",
  oldValueJson: { status: "draft" },
  newValueJson: { status: "submitted" },
  ipAddress: "203.0.113.7",
  userAgent: "vitest",
  createdAt: new Date("2026-07-01T10:00:00.000Z"),
};

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

afterEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("audit log authorization (IT-AUD)", () => {
  it("IT-AUD-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const res = await get();

    expect(res.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-AUD-02: every non-admin role is forbidden and reads nothing", async () => {
    for (const role of [
      "camp_manager",
      "org_representative",
      "independent_initiator",
      "beneficiary",
      "user",
    ]) {
      dbMock.reset();
      authMock.signInAs(role);

      const res = await get();

      expect(res.status, `role ${role} must be forbidden`).toBe(403);
      // Nothing is queried for a forbidden caller.
      expect(dbMock.chains, `role ${role} must not query`).toHaveLength(0);
    }
  });

  it("IT-AUD-03: an administrator receives the audit entries", async () => {
    authMock.signInAs("admin");
    dbMock.queue([sampleRow]);

    const res = await get();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      action: "contribution.submit",
      entityType: "contribution",
    });
  });

  it("IT-AUD-04: paginates with a cursor when a full page is returned", async () => {
    authMock.signInAs("admin");
    // Default limit is 50; return 51 rows so hasMore is true.
    const rows = Array.from({ length: 51 }, (_, i) => ({
      ...sampleRow,
      id: `log-${i}`,
    }));
    dbMock.queue(rows);

    const res = await get();
    const body = await res.json();

    expect(body.items).toHaveLength(50);
    expect(body.nextCursor).toBe(sampleRow.createdAt.toISOString());
  });
});
