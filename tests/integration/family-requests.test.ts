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

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { notifyReviewersOfFamilyRequest, notifyOfContributionSubmission } =
  await import("@/lib/notifications/service");

/**
 * IT-FRQ-*: notifying the reviewers of a family update request.
 *
 * A request sits unseen until somebody with authority to approve it is told,
 * so the recipient set is the point of these tests: the managers of the
 * family's camp plus every administrator, and nobody else.
 */

const REQUEST_ID = "req-1";

const request = (overrides: Record<string, unknown> = {}) => ({
  id: REQUEST_ID,
  type: "update_family_info",
  requestedById: "user-ben",
  campId: "camp-1",
  campName: "Camp One",
  headName: "Abu Ahmad",
  ...overrides,
});

/** Recipient ids of every notification row the service inserted. */
function insertedRecipients(): string[] {
  const values = dbMock
    .chainsStartingWith("insert")
    .flatMap((chain) => chain.ops.find((op) => op.name === "values")?.args ?? []);
  return values
    .flatMap((arg) => (Array.isArray(arg) ? arg : [arg]))
    .map((row) => (row as { userId: string }).userId);
}

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("notifying reviewers of a family request (IT-FRQ)", () => {
  it("IT-FRQ-01: both the camp's managers and every administrator are notified", async () => {
    dbMock.queue(
      [request()],
      [{ userId: "cm-1" }, { userId: "cm-2" }], // managers of camp-1
      [{ id: "admin-1" }], // administrators
    );

    await notifyReviewersOfFamilyRequest(REQUEST_ID);

    expect(insertedRecipients().sort()).toEqual(["admin-1", "cm-1", "cm-2"]);
  });

  it("IT-FRQ-02: a manager who is also an administrator is notified once", async () => {
    dbMock.queue([request()], [{ userId: "cm-1" }], [{ id: "cm-1" }]);

    await notifyReviewersOfFamilyRequest(REQUEST_ID);

    expect(insertedRecipients()).toEqual(["cm-1"]);
  });

  it("IT-FRQ-03: the requester is never asked to review their own request", async () => {
    dbMock.queue(
      [request({ requestedById: "cm-1" })],
      [{ userId: "cm-1" }, { userId: "cm-2" }],
      [],
    );

    await notifyReviewersOfFamilyRequest(REQUEST_ID);

    expect(insertedRecipients()).toEqual(["cm-2"]);
  });

  it("IT-FRQ-04: an unmanaged camp still reaches the administrators", async () => {
    dbMock.queue([request()], [], [{ id: "admin-1" }]);

    await notifyReviewersOfFamilyRequest(REQUEST_ID);

    expect(insertedRecipients()).toEqual(["admin-1"]);
  });

  it("IT-FRQ-05: with no recipient at all nothing is written", async () => {
    dbMock.queue([request()], [], []);

    await notifyReviewersOfFamilyRequest(REQUEST_ID);

    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-FRQ-06: a missing request writes nothing rather than throwing", async () => {
    // Notifications are best-effort: they must never break the action that
    // triggered them.
    dbMock.queue([]);

    await expect(
      notifyReviewersOfFamilyRequest(REQUEST_ID),
    ).resolves.toBeUndefined();
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-FRQ-07: the notification links to the review queue and names the family", async () => {
    dbMock.queue([request()], [{ userId: "cm-1" }], []);

    await notifyReviewersOfFamilyRequest(REQUEST_ID);

    const rows = dbMock.firstArgOf("insert", "values") as Array<{
      message: string;
      link: string;
      entityType: string;
      entityId: string;
    }>;

    expect(rows[0].link).toBe("/dashboard/family-requests");
    expect(rows[0].entityType).toBe("family_update_request");
    expect(rows[0].entityId).toBe(REQUEST_ID);
    expect(rows[0].message).toContain("Abu Ahmad");
    expect(rows[0].message).toContain("Camp One");
  });
});

/**
 * IT-SUB-*: who hears about a submitted contribution.
 *
 * The receiving Camp Manager has to act on it, and an administrator oversees
 * every camp — so both are addressed, rather than the administrator only
 * standing in when a camp happens to have no manager.
 */
describe("notifying recipients of a submitted contribution (IT-SUB)", () => {
  const line = (campId: string, campName: string) => ({
    campId,
    campName,
    providerName: "جمعية الخير",
  });

  it("IT-SUB-01: the receiving camp's manager and the administrator are both told", async () => {
    dbMock.queue(
      [line("camp-1", "مخيم الشمال")],
      [{ campId: "camp-1", userId: "cm-1" }],
      [{ id: "admin-1" }],
    );

    await notifyOfContributionSubmission("contribution-1");

    expect(insertedRecipients().sort()).toEqual(["admin-1", "cm-1"]);
  });

  it("IT-SUB-02: each camp's manager hears about their own camp only", async () => {
    dbMock.queue(
      [line("camp-1", "مخيم الشمال"), line("camp-2", "مخيم الجنوب")],
      [
        { campId: "camp-1", userId: "cm-1" },
        { campId: "camp-2", userId: "cm-2" },
      ],
      [],
    );

    await notifyOfContributionSubmission("contribution-1");

    const rows = dbMock.firstArgOf("insert", "values") as Array<{
      userId: string;
      message: string;
    }>;
    const byUser = new Map(rows.map((r) => [r.userId, r.message]));

    expect(byUser.get("cm-1")).toContain("مخيم الشمال");
    expect(byUser.get("cm-1")).not.toContain("مخيم الجنوب");
    expect(byUser.get("cm-2")).toContain("مخيم الجنوب");
    expect(byUser.get("cm-2")).not.toContain("مخيم الشمال");
  });

  it("IT-SUB-03: the administrator's summary names every camp involved", async () => {
    dbMock.queue(
      [line("camp-1", "مخيم الشمال"), line("camp-2", "مخيم الجنوب")],
      [],
      [{ id: "admin-1" }],
    );

    await notifyOfContributionSubmission("contribution-1");

    const rows = dbMock.firstArgOf("insert", "values") as Array<{
      userId: string;
      message: string;
    }>;
    const adminMessage = rows.find((r) => r.userId === "admin-1")!.message;

    expect(adminMessage).toContain("مخيم الشمال");
    expect(adminMessage).toContain("مخيم الجنوب");
  });

  it("IT-SUB-04: an unmanaged camp is flagged to the administrator", async () => {
    // Nobody on the camp side will see those lines, so the warning is the only
    // thing standing between the aid and nobody expecting it.
    dbMock.queue(
      [line("camp-1", "مخيم الشمال"), line("camp-2", "مخيم الجنوب")],
      [{ campId: "camp-1", userId: "cm-1" }],
      [{ id: "admin-1" }],
    );

    await notifyOfContributionSubmission("contribution-1");

    const rows = dbMock.firstArgOf("insert", "values") as Array<{
      userId: string;
      message: string;
    }>;
    const adminMessage = rows.find((r) => r.userId === "admin-1")!.message;

    expect(adminMessage).toContain("لا يوجد مدير");
    expect(adminMessage).toContain("مخيم الجنوب");
  });

  it("IT-SUB-05: a contribution with no line notifies nobody", async () => {
    dbMock.queue([]);

    await notifyOfContributionSubmission("contribution-1");

    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });
});
