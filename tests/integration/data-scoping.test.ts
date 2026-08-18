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

// Cache revalidation needs a live Next request context; these tests exercise
// the authorization path, not the cache.
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { GET: LIST_FAMILIES } = await import("@/app/api/families/route");
const { GET: READ_FAMILY } = await import("@/app/api/families/[id]/route");
const { GET: LIST_CAMPS } = await import("@/app/api/camps/route");
const { GET: LIST_PROVIDERS } = await import("@/app/api/providers/route");
const { GET: LIST_AID_TYPES } = await import("@/app/api/aid-types/route");
const { GET: RUN_NEEDS_CRON } = await import("@/app/api/cron/update-needs/route");
const { GET: LIST_AID_REQUESTS } = await import("@/app/api/aid-requests/route");
const { POST: RESPOND_TO_REQUEST } = await import(
  "@/app/api/aid-requests/[id]/respond/route"
);
const { POST: SAVE_OWN_FAMILY, PUT: UPDATE_OWN_FAMILY } = await import(
  "@/app/api/my-family/route"
);

/**
 * IT-SCP-*: read scoping on the collection endpoints.
 *
 * These cover the failure mode the guard exists to prevent: a route that
 * authenticates the caller, filters for one privileged role, and then falls
 * through to returning every row for everyone else. Each endpoint is therefore
 * probed with every role that must NOT see the data, not just one sample.
 */

const FAMILY_ROWS = [
  { id: "fam-1", campId: "camp-1", headName: "A", nationalId: "111" },
];

const get = (url: string) => new NextRequest(url, { method: "GET" });

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("listing families (IT-SCP)", () => {
  it("IT-SCP-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await LIST_FAMILIES(get("http://localhost:3000/api/families"));

    expect(response.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-SCP-02: no role without record-level family access reads the register", async () => {
    // Household records carry national ID numbers. Roles holding `family.read`
    // at aggregate scope only (org_representative) must be refused here too.
    for (const role of [
      "user",
      "beneficiary",
      "org_representative",
      "independent_initiator",
    ] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await LIST_FAMILIES(get("http://localhost:3000/api/families"));

      expect(response.status, `role ${role}`).toBe(403);
      expect(dbMock.chains, `role ${role}`).toHaveLength(0);
    }
  });

  it("IT-SCP-03: an administrator reads every active family", async () => {
    authMock.signInAs("admin");
    dbMock.queue(FAMILY_ROWS);

    const response = await LIST_FAMILIES(get("http://localhost:3000/api/families"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(FAMILY_ROWS);
  });

  it("IT-SCP-04: a camp manager with no assigned camp reads nothing", async () => {
    // Fail closed: an unassigned manager must get an empty list, never all rows.
    authMock.signInAs("camp_manager");
    dbMock.queue([]); // camp_assignment lookup

    const response = await LIST_FAMILIES(get("http://localhost:3000/api/families"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
    // Only the scope lookup ran; the family table was never queried.
    expect(dbMock.chains).toHaveLength(1);
  });

  it("IT-SCP-05: a camp manager's scope is pushed into the family query", async () => {
    authMock.signInAs("camp_manager");
    dbMock.queue([{ campId: "camp-1" }], FAMILY_ROWS);

    const response = await LIST_FAMILIES(get("http://localhost:3000/api/families"));

    expect(response.status).toBe(200);
    const familyQuery = dbMock.chainsStartingWith("select")[1];
    // A `where` narrows the query itself rather than filtering the result set
    // in JavaScript, so out-of-scope rows never leave the database.
    expect(familyQuery.ops.some((op) => op.name === "where")).toBe(true);
  });
});

describe("reading a single family (IT-SCP)", () => {
  const readFamily = (id: string) =>
    READ_FAMILY(get(`http://localhost:3000/api/families/${id}`), {
      params: Promise.resolve({ id }),
    });

  it("IT-SCP-06: a camp manager cannot read a family in another camp", async () => {
    authMock.signInAs("camp_manager");
    dbMock.queue(
      [{ campId: "camp-1" }], // scope: camp-1 only
      [{ id: "fam-9", campId: "camp-2" }], // the requested family
    );

    const response = await readFamily("fam-9");

    expect(response.status).toBe(403);
  });

  it("IT-SCP-07: a camp manager reads a family inside their camp", async () => {
    authMock.signInAs("camp_manager");
    dbMock.queue(
      [{ campId: "camp-1" }],
      [{ id: "fam-1", campId: "camp-1" }],
      [], // members
    );

    const response = await readFamily("fam-1");

    expect(response.status).toBe(200);
  });
});

describe("listing camps and providers (IT-SCP)", () => {
  it("IT-SCP-08: a beneficiary reads neither camps nor providers", async () => {
    for (const role of ["user", "beneficiary"] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      const camps = await LIST_CAMPS(get("http://localhost:3000/api/camps"));
      expect(camps.status, `role ${role}`).toBe(403);

      const providers = await LIST_PROVIDERS(get("http://localhost:3000/api/providers"));
      expect(providers.status, `role ${role}`).toBe(403);

      const aidTypes = await LIST_AID_TYPES(get("http://localhost:3000/api/aid-types"));
      expect(aidTypes.status, `role ${role}`).toBe(403);

      expect(dbMock.chains, `role ${role}`).toHaveLength(0);
    }
  });

  it("IT-SCP-09: a provider role reads camps and aid types but not the provider directory", async () => {
    // They need the camp list and the aid-type catalogue to offer a
    // contribution; the directory of other providers is administered centrally.
    for (const role of ["org_representative", "independent_initiator"] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      dbMock.queue([{ id: "camp-1" }]);
      expect((await LIST_CAMPS(get("http://localhost:3000/api/camps"))).status).toBe(200);

      dbMock.queue([{ id: "type-1" }]);
      expect((await LIST_AID_TYPES(get("http://localhost:3000/api/aid-types"))).status).toBe(200);

      const providers = await LIST_PROVIDERS(get("http://localhost:3000/api/providers"));
      expect(providers.status, `role ${role}`).toBe(403);
    }
  });

  it("IT-SCP-10: a camp manager only ever lists their assigned camps", async () => {
    authMock.signInAs("camp_manager");
    dbMock.queue([{ campId: "camp-1" }], [{ id: "camp-1" }]);

    const response = await LIST_CAMPS(get("http://localhost:3000/api/camps"));

    expect(response.status).toBe(200);
    const campQuery = dbMock.chainsStartingWith("select")[1];
    expect(campQuery.ops.some((op) => op.name === "where")).toBe(true);
  });
});

describe("listing and answering aid requests (IT-SCP)", () => {
  it("IT-SCP-13: a beneficiary cannot see what camps are asking for", async () => {
    for (const role of ["user", "beneficiary"] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await LIST_AID_REQUESTS(
        get("http://localhost:3000/api/aid-requests"),
      );

      expect(response.status, `role ${role}`).toBe(403);
      expect(dbMock.chains, `role ${role}`).toHaveLength(0);
    }
  });

  it("IT-SCP-14: a camp manager with no assignment sees no requests", async () => {
    authMock.signInAs("camp_manager");
    dbMock.queue([]); // camp_assignment lookup

    const response = await LIST_AID_REQUESTS(
      get("http://localhost:3000/api/aid-requests"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
    expect(dbMock.chains).toHaveLength(1);
  });

  it("IT-SCP-15: the camp side cannot answer its own aid request", async () => {
    // Separation of duties: a camp raises the need, a provider commits to it.
    for (const role of ["camp_manager", "beneficiary", "user"] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await RESPOND_TO_REQUEST(
        new NextRequest("http://localhost:3000/api/aid-requests/req-1/respond", {
          method: "POST",
          body: JSON.stringify({ committedQuantity: 10 }),
          headers: { "content-type": "application/json" },
        }),
        { params: Promise.resolve({ id: "req-1" }) },
      );

      expect(response.status, `role ${role}`).toBe(403);
      expect(dbMock.chainsStartingWith("insert"), `role ${role}`).toHaveLength(0);
    }
  });
});

describe("the beneficiary's own household (IT-SCP)", () => {
  const OWN_EMAIL = "111111111@sa3dne.local";
  const OWN_FAMILY = { id: "fam-own", nationalId: "111111111", campId: "camp-1" };

  const body = {
    headName: "New Head",
    memberCount: 4,
    campId: "camp-1",
    // A national ID belonging to somebody else, smuggled into the request.
    nationalId: "999999999",
  };

  const signInAsBeneficiary = () =>
    authMock.setSession({
      user: { id: "user-ben", role: "beneficiary", email: OWN_EMAIL, name: "Ben" },
    });

  it("IT-SCP-16: no other role can write through the self-service endpoint", async () => {
    for (const role of ["user", "camp_manager", "org_representative"] as const) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await SAVE_OWN_FAMILY(
        new NextRequest("http://localhost:3000/api/my-family", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
      );

      expect(response.status, `role ${role}`).toBe(403);
      expect(dbMock.chains, `role ${role}`).toHaveLength(0);
    }
  });

  it("IT-SCP-17: a national ID in the body cannot redirect the write to another household", async () => {
    // The regression this guards: the endpoint used to update
    // `WHERE national_id = <body value>`, so any beneficiary could overwrite
    // any household whose ID number they knew.
    signInAsBeneficiary();
    dbMock.queue([OWN_FAMILY]); // getOwnFamily, resolved from the session

    const response = await UPDATE_OWN_FAMILY(
      new NextRequest("http://localhost:3000/api/my-family", {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);

    expect(dbMock.chainsStartingWith("update")).toHaveLength(1);

    // The national ID is neither written nor echoed anywhere in the payload,
    // and the row was located by a prior lookup keyed on the session.
    const payload = dbMock.firstArgOf("update", "set") as Record<string, unknown>;
    expect(payload).not.toHaveProperty("nationalId");
    expect(Object.values(payload)).not.toContain("999999999");
    expect(dbMock.chainsStartingWith("select")).toHaveLength(1);
  });

  it("IT-SCP-18: updating before registering a household reports 404, not a silent write", async () => {
    signInAsBeneficiary();
    dbMock.queue([]); // no household linked to this account

    const response = await UPDATE_OWN_FAMILY(
      new NextRequest("http://localhost:3000/api/my-family", {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(404);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });
});

describe("the scheduled needs recalculation (IT-SCP)", () => {
  it("IT-SCP-11: an unauthenticated caller cannot trigger the camp needs update", async () => {
    // The endpoint writes to `camp` and to the audit log, so it must never be
    // reachable without the scheduler secret.
    const response = await RUN_NEEDS_CRON(get("http://localhost:3000/api/cron/update-needs"));

    expect([401, 503]).toContain(response.status);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-SCP-12: a wrong bearer token is rejected", async () => {
    const request = new NextRequest("http://localhost:3000/api/cron/update-needs", {
      method: "GET",
      headers: { authorization: "Bearer not-the-secret" },
    });

    const response = await RUN_NEEDS_CRON(request);

    expect([401, 503]).toContain(response.status);
    expect(dbMock.chains).toHaveLength(0);
  });
});
