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

const { POST: SUBMIT } = await import("@/app/api/contributions/[id]/submit/route");
const { POST: ADD_LINE } = await import("@/app/api/contributions/[id]/lines/route");

/**
 * IT-CTB-* / IT-LIN-*: The provider side of the aid workflow.
 *
 * Phase 03 rules under test: a contribution is editable only while it is a
 * draft, it cannot be submitted empty, providers act only on their own
 * contributions, and lines may only target camps and aid types that are still
 * selectable.
 */

const CONTRIBUTION_ID = "contribution-1";
const PROVIDER_ID = "provider-1";

const draftContribution = (overrides: Record<string, unknown> = {}) => ({
  id: CONTRIBUTION_ID,
  providerId: PROVIDER_ID,
  status: "draft",
  ...overrides,
});

const activeProvider = (id = PROVIDER_ID) => ({
  id,
  status: "active",
  linkedUserId: "user-org_representative",
  type: "organization",
});

const activeCamp = (overrides: Record<string, unknown> = {}) => ({
  id: "camp-a",
  name: "Camp A",
  status: "active",
  operationalStatus: "active",
  ...overrides,
});

const activeAidType = (overrides: Record<string, unknown> = {}) => ({
  id: "aid-type-1",
  name: "Water",
  status: "active",
  ...overrides,
});

const submit = () =>
  SUBMIT(
    new NextRequest(
      `http://localhost:3000/api/contributions/${CONTRIBUTION_ID}/submit`,
      { method: "POST" },
    ),
    { params: Promise.resolve({ id: CONTRIBUTION_ID }) },
  );

const addLine = (body: unknown) =>
  ADD_LINE(
    new NextRequest(
      `http://localhost:3000/api/contributions/${CONTRIBUTION_ID}/lines`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      },
    ),
    { params: Promise.resolve({ id: CONTRIBUTION_ID }) },
  );

const validLine = {
  campId: "camp-a",
  aidTypeId: "aid-type-1",
  plannedQuantity: 50,
  unit: "boxes",
  plannedDeliveryDate: "2026-03-10",
};

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("submitting a contribution (IT-CTB)", () => {
  it("IT-CTB-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await submit();

    expect(response.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-CTB-02: a missing contribution returns 404", async () => {
    authMock.signInAs("admin");
    dbMock.queue([]);

    const response = await submit();

    expect(response.status).toBe(404);
  });

  it("IT-CTB-03: a provider cannot submit another provider's contribution", async () => {
    // Providers may act only on their own contributions.
    authMock.signInAs("org_representative");
    dbMock.queue(
      [draftContribution({ providerId: "provider-other" })],
      [activeProvider(PROVIDER_ID)],
    );

    const response = await submit();

    expect(response.status).toBe(403);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CTB-04: a user with no active provider profile cannot submit", async () => {
    // Covers a deactivated provider: the profile lookup filters on active.
    authMock.signInAs("org_representative");
    dbMock.queue([draftContribution()], []);

    const response = await submit();

    expect(response.status).toBe(403);
  });

  it("IT-CTB-05: an empty contribution cannot be submitted", async () => {
    authMock.signInAs("org_representative");
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [], // no lines
    );

    const response = await submit();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/at least one valid line/i),
    });
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CTB-06: an already-submitted contribution cannot be submitted again", async () => {
    // Guards against double-promising the same aid to a camp.
    authMock.signInAs("org_representative");
    dbMock.queue(
      [draftContribution({ status: "submitted" })],
      [activeProvider()],
    );

    const response = await submit();

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-CTB-07: a cancelled contribution cannot be submitted", async () => {
    authMock.signInAs("org_representative");
    dbMock.queue(
      [draftContribution({ status: "cancelled" })],
      [activeProvider()],
    );

    const response = await submit();

    expect(response.status).toBe(409);
  });

  it("IT-CTB-08: a draft with lines is submitted and its lines become pending", async () => {
    authMock.signInAs("org_representative");
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [{ id: "line-1" }],
      [], // update header
      [], // update lines
    );

    const response = await submit();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      status: "submitted",
    });

    const [headerUpdate, lineUpdate] = dbMock.chainsStartingWith("update");
    expect(headerUpdate.ops.find((o) => o.name === "set")?.args[0]).toMatchObject({
      status: "submitted",
    });
    expect(lineUpdate.ops.find((o) => o.name === "set")?.args[0]).toMatchObject({
      status: "pending",
    });
  });

  it("IT-CTB-09: submitting stamps the submission time", async () => {
    authMock.signInAs("admin");
    dbMock.queue([draftContribution()], [{ id: "line-1" }], [], []);

    await submit();

    const update = dbMock.firstArgOf("update", "set") as { submittedAt?: Date };
    expect(update.submittedAt).toBeInstanceOf(Date);
  });
});

describe("adding lines to a contribution (IT-LIN)", () => {
  beforeEach(() => {
    authMock.signInAs("org_representative");
  });

  it("IT-LIN-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await addLine(validLine);

    expect(response.status).toBe(401);
  });

  it("IT-LIN-02: a line cannot be added to a submitted contribution", async () => {
    // Once submitted, the promise is visible to camps and must not change.
    dbMock.queue(
      [draftContribution({ status: "submitted" })],
      [activeProvider()],
    );

    const response = await addLine(validLine);

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-LIN-03: a provider cannot add a line to another provider's contribution", async () => {
    dbMock.queue(
      [draftContribution({ providerId: "provider-other" })],
      [activeProvider(PROVIDER_ID)],
    );

    const response = await addLine(validLine);

    expect(response.status).toBe(403);
  });

  it("IT-LIN-04: a zero or negative quantity is refused with 400", async () => {
    for (const quantity of [0, -10]) {
      dbMock.reset();
      dbMock.queue([draftContribution()], [activeProvider()]);

      const response = await addLine({ ...validLine, plannedQuantity: quantity });

      expect(response.status).toBe(400);
      expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
    }
  });

  it("IT-LIN-05: a fractional quantity is refused with 400", async () => {
    dbMock.queue([draftContribution()], [activeProvider()]);

    const response = await addLine({ ...validLine, plannedQuantity: 2.5 });

    expect(response.status).toBe(400);
  });

  it("IT-LIN-06: a line targeting a closed camp is refused with 400", async () => {
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [activeCamp({ operationalStatus: "closed" })],
    );

    const response = await addLine(validLine);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/inactive or closed camp/i),
    });
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-LIN-07: a line targeting a deactivated camp is refused with 400", async () => {
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [activeCamp({ status: "inactive" })],
    );

    const response = await addLine(validLine);

    expect(response.status).toBe(400);
  });

  it("IT-LIN-08: a line referencing a missing camp returns 404", async () => {
    dbMock.queue([draftContribution()], [activeProvider()], []);

    const response = await addLine(validLine);

    expect(response.status).toBe(404);
  });

  it("IT-LIN-09: a line using a deactivated aid type is refused with 400", async () => {
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [activeCamp()],
      [activeAidType({ status: "inactive" })],
    );

    const response = await addLine(validLine);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/inactive aid type/i),
    });
  });

  it("IT-LIN-10: a valid line is created against an active camp and aid type", async () => {
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [activeCamp()],
      [activeAidType()],
      [], // insert line
      [], // touch header
    );

    const response = await addLine(validLine);

    expect(response.status).toBe(201);
    expect(dbMock.firstArgOf("insert", "values")).toMatchObject({
      contributionId: CONTRIBUTION_ID,
      campId: "camp-a",
      aidTypeId: "aid-type-1",
      plannedQuantity: 50,
      status: "pending",
    });
  });

  it("IT-LIN-11: a new line starts with no receipt data recorded", async () => {
    // Aid is only ever *planned* by a provider; what arrived is decided later
    // by the camp side.
    dbMock.queue(
      [draftContribution()],
      [activeProvider()],
      [activeCamp()],
      [activeAidType()],
      [],
      [],
    );

    await addLine(validLine);

    expect(dbMock.firstArgOf("insert", "values")).toMatchObject({
      actualReceivedQuantity: null,
      actualReceiptDate: null,
      confirmedById: null,
      confirmedAt: null,
    });
  });
});
