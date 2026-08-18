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

vi.mock("@/lib/auth/auth", async () => {
  const { authMock } = await import("../helpers/auth-mock");
  return { auth: authMock.auth };
});

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

// Server actions read the session through `headers()`, which needs a live
// request scope; the session itself is controlled by the auth mock.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

// Hashing a password is slow by design and irrelevant to the linking rules.
vi.mock("better-auth/crypto", () => ({
  hashPassword: async () => "hashed",
}));

const { POST: CREATE_FAMILY } = await import("@/app/api/families/route");
const { createUserAction } = await import("@/lib/actions/users");

/**
 * IT-LNK-*: the one-to-one link between a household and its head's account.
 *
 * Whichever end is created first, the other must come with it and the two must
 * end up joined by `family.user_id`. A household with no account cannot be
 * maintained by the people it describes; a beneficiary account with no
 * household has nothing to show and is counted nowhere.
 */

const HEAD = {
  campId: "camp-1",
  headName: "أبو أحمد",
  nationalId: "405123456",
  phone: "0599000000",
  memberCount: 5,
  headEmail: "abu.ahmad@example.com",
  headPassword: "Family@12345",
};

const createFamily = (body: Record<string, unknown> = {}) =>
  CREATE_FAMILY(
    new NextRequest("http://localhost:3000/api/families", {
      method: "POST",
      body: JSON.stringify({ ...HEAD, ...body }),
      headers: { "content-type": "application/json" },
    }),
  );

/** Rows passed to every `insert().values()` call, flattened. */
function insertedRows(): Record<string, any>[] {
  return dbMock
    .chainsStartingWith("insert")
    .flatMap((c) => c.ops.find((o) => o.name === "values")?.args ?? [])
    .flatMap((arg) => (Array.isArray(arg) ? arg : [arg])) as Record<string, any>[];
}

beforeEach(() => {
  dbMock.reset();
  authMock.reset();
});

describe("registering a family creates the head's account (IT-LNK)", () => {
  it("IT-LNK-01: the account and the household are written with the same user id", async () => {
    authMock.signInAs("admin");
    dbMock.queue(
      [], // no duplicate national id
      [], // e-mail not taken
    );

    const response = await createFamily();

    expect(response.status).toBe(201);

    const rows = insertedRows();
    const userRow = rows.find((r) => r.email === HEAD.headEmail);
    const familyRow = rows.find((r) => r.nationalId === HEAD.nationalId);

    expect(userRow).toBeDefined();
    expect(familyRow).toBeDefined();
    expect(familyRow!.userId).toBe(userRow!.id);
  });

  it("IT-LNK-02: the created account is a beneficiary scoped to the family's camp", async () => {
    authMock.signInAs("admin");
    dbMock.queue([], []);

    await createFamily();

    const userRow = insertedRows().find((r) => r.email === HEAD.headEmail)!;
    expect(userRow.role).toBe("beneficiary");
    expect(userRow.campId).toBe(HEAD.campId);
    // The account holder is the head of household by definition.
    expect(userRow.name).toBe(HEAD.headName);
  });

  it("IT-LNK-03: credentials are stored so the head can actually sign in", async () => {
    authMock.signInAs("admin");
    dbMock.queue([], []);

    await createFamily();

    const rows = insertedRows();
    const userRow = rows.find((r) => r.email === HEAD.headEmail)!;
    const accountRow = rows.find((r) => r.providerId === "credential");

    expect(accountRow).toBeDefined();
    expect(accountRow!.userId).toBe(userRow.id);
    expect(accountRow!.password).toBeTruthy();
  });

  it("IT-LNK-04: a missing e-mail or a short password is refused with 400", async () => {
    authMock.signInAs("admin");

    for (const bad of [{ headEmail: "" }, { headPassword: "short" }]) {
      dbMock.reset();
      const response = await createFamily(bad);

      expect(response.status, JSON.stringify(bad)).toBe(400);
      expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
    }
  });

  it("IT-LNK-05: an e-mail already in use is refused before anything is written", async () => {
    authMock.signInAs("admin");
    dbMock.queue([], [{ id: "user-existing" }]);

    const response = await createFamily();

    expect(response.status).toBe(409);
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });
});

describe("creating a beneficiary creates their household (IT-LNK)", () => {
  const newBeneficiary = (household: Record<string, unknown> | null = {
    nationalId: "405123456",
    campId: "camp-1",
    memberCount: 5,
  }) =>
    createUserAction({
      name: "أبو أحمد",
      email: "abu.ahmad@example.com",
      password: "Family@12345",
      role: "beneficiary",
      phone: "0599000000",
      household: household as any,
    });

  it("IT-LNK-06: the household is written with the new account's id", async () => {
    authMock.signInAs("admin");
    dbMock.queue(
      [], // no user with that e-mail
      [], // no active family with that national id
    );

    const result = await newBeneficiary();

    expect(result).toEqual({ success: true });

    const rows = insertedRows();
    const userRow = rows.find((r) => r.role === "beneficiary")!;
    const familyRow = rows.find((r) => r.nationalId === "405123456")!;

    expect(familyRow.userId).toBe(userRow.id);
    // The head of household defaults to the name on the account.
    expect(familyRow.headName).toBe("أبو أحمد");
    expect(familyRow.campId).toBe("camp-1");
  });

  it("IT-LNK-07: household details are required for a beneficiary", async () => {
    authMock.signInAs("admin");

    for (const [label, household] of [
      ["missing entirely", null],
      ["no national id", { nationalId: "", campId: "camp-1", memberCount: 5 }],
      ["no camp", { nationalId: "405123456", campId: "", memberCount: 5 }],
      ["no members", { nationalId: "405123456", campId: "camp-1", memberCount: 0 }],
    ] as const) {
      dbMock.reset();

      const result = await newBeneficiary(household);

      expect(result.error, label).toBeTruthy();
      expect(dbMock.chains, label).toHaveLength(0);
    }
  });

  it("IT-LNK-08: a national id already held by an active family is refused", async () => {
    authMock.signInAs("admin");
    dbMock.queue([], [{ id: "fam-existing" }]);

    const result = await newBeneficiary();

    expect(result.error).toBe("errNationalIdInUse");
    expect(dbMock.chainsStartingWith("insert")).toHaveLength(0);
  });

  it("IT-LNK-09: a non-beneficiary role creates no household", async () => {
    authMock.signInAs("admin");
    dbMock.queue([]); // no user with that e-mail

    const result = await createUserAction({
      name: "مدير المخيم",
      email: "manager@example.com",
      password: "Manager@12345",
      role: "camp_manager",
      phone: null,
      campId: "camp-1",
    });

    expect(result).toEqual({ success: true });
    expect(insertedRows().some((r) => r.nationalId)).toBe(false);
  });
});
