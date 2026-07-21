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

const { GET } = await import("@/app/api/notifications/route");
const { PATCH } = await import("@/app/api/notifications/[id]/read/route");

/**
 * IT-NOT-*: Notification endpoints.
 *
 * Phase 06 rules: notifications respect scope (a user only ever sees and
 * mutates rows addressed to their own id) and require authentication. These
 * cover the server-side enforcement of both.
 */

const NOTE_ID = "note-1";

const list = (query = "") =>
  GET(new NextRequest(`http://localhost:3000/api/notifications${query}`));

const markRead = (id = NOTE_ID) =>
  PATCH(
    new NextRequest(`http://localhost:3000/api/notifications/${id}/read`, {
      method: "PATCH",
    }),
    { params: Promise.resolve({ id }) },
  );

const sampleNote = {
  id: NOTE_ID,
  userId: "user-camp_manager",
  title: "New aid submitted",
  message: "Provider X submitted aid for Camp A.",
  link: "/dashboard/incoming-aid",
  status: "unread",
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

describe("listing notifications (IT-NOT)", () => {
  it("IT-NOT-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const res = await list();

    expect(res.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-NOT-02: returns the caller's notifications and unread count", async () => {
    authMock.signInAs("camp_manager");
    // Order: listNotifications rows, then getUnreadCount aggregate.
    dbMock.queue([sampleNote], [{ count: 1 }]);

    const res = await list();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ id: NOTE_ID, status: "unread" });
    expect(body.unreadCount).toBe(1);
  });
});

describe("marking a notification read (IT-NOT)", () => {
  it("IT-NOT-03: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const res = await markRead();

    expect(res.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-NOT-04: marking own unread notification succeeds", async () => {
    authMock.signInAs("camp_manager");
    // The scoped UPDATE ... RETURNING yields the affected row id.
    dbMock.queue([{ id: NOTE_ID }]);

    const res = await markRead();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true });
    expect(dbMock.chainsStartingWith("update")).toHaveLength(1);
  });

  it("IT-NOT-05: another user's notification is not found (scope enforced)", async () => {
    authMock.signInAs("camp_manager");
    // The userId-scoped WHERE matches nothing, so RETURNING is empty.
    dbMock.queue([]);

    const res = await markRead("someone-elses-note");

    expect(res.status).toBe(404);
  });
});
