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

const { PUT: UPDATE_USER } = await import("@/app/api/users/[id]/route");
const { POST: CREATE_PROVIDER } = await import("@/app/api/providers/route");

/**
 * IT-USR-* / IT-PRV-*: Administrator-only surfaces.
 *
 * Phase 01 and 03 rules under test: only the System Administrator may change a
 * user's role or register an aid provider, and a provider profile may only be
 * linked to an account whose role matches the provider type.
 *
 * The non-admin roles are enumerated explicitly rather than spot-checked: a new
 * role added to the enum without a matching authorization decision is exactly
 * the kind of gap these tests exist to catch.
 */

const NON_ADMIN_ROLES = [
  "user",
  "camp_manager",
  "org_representative",
  "independent_initiator",
  "beneficiary",
] as const;

const TARGET_USER_ID = "user-target";

const updateUser = (body: unknown) =>
  UPDATE_USER(
    new NextRequest(`http://localhost:3000/api/users/${TARGET_USER_ID}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id: TARGET_USER_ID }) },
  );

const createProvider = (body: unknown) =>
  CREATE_PROVIDER(
    new NextRequest("http://localhost:3000/api/providers", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("changing a user's role (IT-USR)", () => {
  it("IT-USR-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await updateUser({ role: "admin" });

    expect(response.status).toBe(401);
    expect(dbMock.chains).toHaveLength(0);
  });

  it("IT-USR-02: no non-admin role may change any user's role", async () => {
    // Privilege escalation guard: the whole permission model rests on this.
    for (const role of NON_ADMIN_ROLES) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await updateUser({ role: "admin" });

      expect(response.status, `role "${role}" was allowed to assign roles`).toBe(403);
      expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
    }
  });

  it("IT-USR-03: an administrator can change a user's role", async () => {
    authMock.signInAs("admin");
    dbMock.queue([]);

    const response = await updateUser({ role: "camp_manager" });

    expect(response.status).toBe(200);
    expect(dbMock.firstArgOf("update", "set")).toMatchObject({
      role: "camp_manager",
    });
  });

  it("IT-USR-04: a role outside the enum is refused with 400", async () => {
    authMock.signInAs("admin");

    const response = await updateUser({ role: "super_admin" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
  });

  it("IT-USR-05: only the supplied fields are written", async () => {
    // A partial update must not blank out the fields it did not mention.
    authMock.signInAs("admin");
    dbMock.queue([]);

    await updateUser({ name: "Bahaa Abushrar" });

    const updates = dbMock.firstArgOf("update", "set") as Record<string, unknown>;
    expect(updates).toEqual({ name: "Bahaa Abushrar" });
    expect(updates).not.toHaveProperty("role");
  });

  it("IT-USR-06: a too-short name is refused with 400", async () => {
    authMock.signInAs("admin");

    const response = await updateUser({ name: "A" });

    expect(response.status).toBe(400);
  });
});

describe("registering an aid provider (IT-PRV)", () => {
  const orgProvider = {
    type: "organization",
    name: "Relief Organization",
    email: "contact@relief.org",
  };

  it("IT-PRV-01: an anonymous request is rejected with 401", async () => {
    authMock.signOut();

    const response = await createProvider(orgProvider);

    expect(response.status).toBe(401);
  });

  it("IT-PRV-02: no non-admin role may register a provider", async () => {
    for (const role of NON_ADMIN_ROLES) {
      dbMock.reset();
      authMock.signInAs(role);

      const response = await createProvider(orgProvider);

      expect(response.status, `role "${role}" was allowed to register a provider`).toBe(403);
      expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
    }
  });

  it("IT-PRV-03: a provider type outside the enum is refused with 400", async () => {
    authMock.signInAs("admin");

    const response = await createProvider({ ...orgProvider, type: "government" });

    expect(response.status).toBe(400);
  });

  it("IT-PRV-04: a malformed email is refused with 400", async () => {
    authMock.signInAs("admin");

    const response = await createProvider({ ...orgProvider, email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-PRV-05: linking to a non-existent user account is refused with 400", async () => {
    authMock.signInAs("admin");
    dbMock.queue([]);

    const response = await createProvider({ ...orgProvider, linkedUserId: "ghost" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/linked user not found/i),
    });
  });

  it("IT-PRV-06: linking to a banned account is refused with 400", async () => {
    // A deactivated account must not regain reach through a provider profile.
    authMock.signInAs("admin");
    dbMock.queue([{ id: "u1", role: "org_representative", banned: true }]);

    const response = await createProvider({ ...orgProvider, linkedUserId: "u1" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/deactivated|banned/i),
    });
  });

  it("IT-PRV-07: an organization provider cannot be linked to an independent initiator", async () => {
    authMock.signInAs("admin");
    dbMock.queue([{ id: "u1", role: "independent_initiator", banned: false }]);

    const response = await createProvider({ ...orgProvider, linkedUserId: "u1" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-PRV-08: an independent provider cannot be linked to an organization representative", async () => {
    authMock.signInAs("admin");
    dbMock.queue([{ id: "u1", role: "org_representative", banned: false }]);

    const response = await createProvider({
      type: "independent_initiator",
      name: "Local Initiative",
      linkedUserId: "u1",
    });

    expect(response.status).toBe(400);
  });

  it("IT-PRV-09: a provider cannot be linked to a camp manager account", async () => {
    // Separation of duties: the account that confirms receipt must not also be
    // the account that promises the aid.
    authMock.signInAs("admin");
    dbMock.queue([{ id: "u1", role: "camp_manager", banned: false }]);

    const response = await createProvider({ ...orgProvider, linkedUserId: "u1" });

    expect(response.status).toBe(400);
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-PRV-10: an organization provider links to an organization representative", async () => {
    authMock.signInAs("admin");
    dbMock.queue([{ id: "u1", role: "org_representative", banned: false }], []);

    const response = await createProvider({ ...orgProvider, linkedUserId: "u1" });

    expect(response.status).toBe(201);
    expect(dbMock.firstArgOf("insert", "values")).toMatchObject({
      type: "organization",
      name: "Relief Organization",
      linkedUserId: "u1",
      status: "active",
    });
  });

  it("IT-PRV-11: a provider may be registered with no linked account", async () => {
    // Offline-registered providers exist before their account does.
    authMock.signInAs("admin");
    dbMock.queue([]);

    const response = await createProvider(orgProvider);

    expect(response.status).toBe(201);
    expect(dbMock.firstArgOf("insert", "values")).toMatchObject({
      linkedUserId: null,
      status: "active",
    });
  });
});
