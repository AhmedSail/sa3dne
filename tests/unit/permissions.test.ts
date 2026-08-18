import { describe, expect, it } from "vitest";
import { ac, roles, type AppRole } from "@/lib/auth/modules/authorization/permissions";

/**
 * UT-PRM-*: Role & permission matrix.
 *
 * These assert the declarative access-control matrix in `permissions.ts`
 * against `.claude/Roles_and_Permissions_Matrix_EN.md`. They are pure: no
 * database, no session, no HTTP. Route-level enforcement of the same rules is
 * covered separately by the IT-* integration tests.
 */

const ALL_ROLES = Object.keys(roles) as AppRole[];

const can = (role: AppRole, request: Record<string, string[]>) =>
  roles[role].authorize(request as never).success;

describe("access control statements (UT-PRM)", () => {
  it("UT-PRM-01: declares every resource the system authorizes against", () => {
    expect(Object.keys(ac.statements).sort()).toEqual(
      [
        "aidRequest",
        "aidType",
        "alert",
        "audit",
        "camp",
        "classification",
        "complaint",
        "contribution",
        "dashboard",
        "distribution",
        "family",
        "loginAttempt",
        "provider",
        "report",
        "resource",
        "role",
        "sync",
        "user",
      ].sort(),
    );
  });

  it("UT-PRM-02: defines exactly the six application roles", () => {
    expect(ALL_ROLES.sort()).toEqual(
      [
        "admin",
        "beneficiary",
        "camp_manager",
        "independent_initiator",
        "org_representative",
        "user",
      ].sort(),
    );
  });

  it("UT-PRM-03: no role grants an action outside its resource's declared actions", () => {
    // Guards against typos such as camp: ["delete_all"] silently never matching.
    for (const role of ALL_ROLES) {
      const statements = roles[role].statements as unknown as Record<
        string,
        readonly string[]
      >;
      for (const [resource, actions] of Object.entries(statements)) {
        const declared = (ac.statements as Record<string, readonly string[]>)[resource];
        expect(declared, `role ${role} references unknown resource "${resource}"`).toBeDefined();
        for (const action of actions) {
          expect(
            declared,
            `role ${role} grants undeclared action "${resource}:${action}"`,
          ).toContain(action);
        }
      }
    }
  });
});

describe("System Administrator (UT-PRM)", () => {
  it("UT-PRM-04: can manage users, roles, camps and audit data", () => {
    expect(can("admin", { user: ["create", "read", "update", "deactivate"] })).toBe(true);
    expect(can("admin", { role: ["assign"] })).toBe(true);
    expect(can("admin", { camp: ["create", "update", "delete", "assign_manager"] })).toBe(true);
    expect(can("admin", { audit: ["read"] })).toBe(true);
  });

  it("UT-PRM-05: does not author contributions, only reads and receives them", () => {
    // Contributions originate from providers; the admin oversees them.
    expect(can("admin", { contribution: ["read", "receive"] })).toBe(true);
    expect(can("admin", { contribution: ["create_official"] })).toBe(false);
    expect(can("admin", { contribution: ["create_independent"] })).toBe(false);
  });
});

describe("Camp Manager (UT-PRM)", () => {
  it("UT-PRM-06: can receive contributions but never create them", () => {
    expect(can("camp_manager", { contribution: ["read", "receive"] })).toBe(true);
    expect(can("camp_manager", { contribution: ["create_official"] })).toBe(false);
    expect(can("camp_manager", { contribution: ["create_independent"] })).toBe(false);
  });

  it("UT-PRM-07: can manage families for statistics, including transfers", () => {
    expect(
      can("camp_manager", { family: ["create", "read", "update", "delete", "transfer"] }),
    ).toBe(true);
  });

  it("UT-PRM-08: cannot create or delete camps, or assign managers", () => {
    expect(can("camp_manager", { camp: ["read", "update"] })).toBe(true);
    expect(can("camp_manager", { camp: ["create"] })).toBe(false);
    expect(can("camp_manager", { camp: ["delete"] })).toBe(false);
    expect(can("camp_manager", { camp: ["assign_manager"] })).toBe(false);
  });

  it("UT-PRM-09: cannot administer users, roles or audit logs", () => {
    expect(can("camp_manager", { user: ["create"] })).toBe(false);
    expect(can("camp_manager", { user: ["deactivate"] })).toBe(false);
    expect(can("camp_manager", { role: ["assign"] })).toBe(false);
    expect(can("camp_manager", { audit: ["read"] })).toBe(false);
  });
});

describe("Providers (UT-PRM)", () => {
  it("UT-PRM-10: an organization representative creates official contributions only", () => {
    expect(can("org_representative", { contribution: ["create_official"] })).toBe(true);
    expect(can("org_representative", { contribution: ["create_independent"] })).toBe(false);
  });

  it("UT-PRM-11: an independent initiator creates independent contributions only", () => {
    expect(can("independent_initiator", { contribution: ["create_independent"] })).toBe(true);
    expect(can("independent_initiator", { contribution: ["create_official"] })).toBe(false);
  });

  it("UT-PRM-12: no provider role may confirm receipt of its own aid", () => {
    // Separation of duties: the provider promises, the camp side confirms.
    expect(can("org_representative", { contribution: ["receive"] })).toBe(false);
    expect(can("independent_initiator", { contribution: ["receive"] })).toBe(false);
  });

  it("UT-PRM-13: no provider role may touch camps or families", () => {
    for (const role of ["org_representative", "independent_initiator"] as const) {
      expect(can(role, { camp: ["create"] })).toBe(false);
      expect(can(role, { camp: ["update"] })).toBe(false);
      expect(can(role, { family: ["create"] })).toBe(false);
      expect(can(role, { family: ["update"] })).toBe(false);
    }
  });

  it("UT-PRM-14: an independent initiator cannot read family data at all", () => {
    expect(can("independent_initiator", { family: ["read"] })).toBe(false);
    // ...whereas an organization representative may, for reporting.
    expect(can("org_representative", { family: ["read"] })).toBe(true);
  });
});

describe("Beneficiary and fallback roles (UT-PRM)", () => {
  it("UT-PRM-15: a beneficiary may only file and track complaints", () => {
    expect(can("beneficiary", { complaint: ["create", "read", "track"] })).toBe(true);
    expect(can("beneficiary", { user: ["update_self"] })).toBe(true);
  });

  it("UT-PRM-16: a beneficiary cannot reach any operational resource", () => {
    expect(can("beneficiary", { camp: ["read"] })).toBe(false);
    expect(can("beneficiary", { family: ["read"] })).toBe(false);
    expect(can("beneficiary", { contribution: ["read"] })).toBe(false);
    expect(can("beneficiary", { dashboard: ["view"] })).toBe(false);
    expect(can("beneficiary", { report: ["read_aggregated"] })).toBe(false);
  });

  it("UT-PRM-17: the fallback 'user' role has no more power than a beneficiary", () => {
    // New sign-ups default to `user`; that must not be a privilege escalation.
    // A subset, not an equality: `beneficiary` is assigned deliberately and
    // additionally owns its household record (`family.manage_own`), which an
    // unreviewed sign-up must not inherit.
    const beneficiary = roles.beneficiary.statements as Record<string, readonly string[]>;
    const fallback = roles.user.statements as Record<string, readonly string[]>;

    for (const [resource, actions] of Object.entries(fallback)) {
      expect(beneficiary[resource], `resource ${resource}`).toBeDefined();
      for (const action of actions) {
        expect(beneficiary[resource], `${resource}.${action}`).toContain(action);
      }
    }
  });

  it("UT-PRM-17b: the fallback 'user' role does not own a household record", () => {
    // `family.manage_own` drives the beneficiary self-service screens, which
    // resolve the household from the account. A default sign-up has none.
    expect(can("user", { family: ["manage_own"] })).toBe(false);
    expect(can("beneficiary", { family: ["manage_own"] })).toBe(true);
  });

  it("UT-PRM-18: only the administrator can assign roles", () => {
    for (const role of ALL_ROLES) {
      expect(can(role, { role: ["assign"] })).toBe(role === "admin");
    }
  });

  it("UT-PRM-19: only the administrator can read the audit log", () => {
    for (const role of ALL_ROLES) {
      expect(can(role, { audit: ["read"] })).toBe(role === "admin");
      expect(can(role, { loginAttempt: ["read"] })).toBe(role === "admin");
    }
  });

  it("UT-PRM-20: every role can edit its own profile", () => {
    // The admin does this through the broader `user:update` grant rather than
    // `update_self`, so accept either.
    for (const role of ALL_ROLES) {
      const canEditOwnProfile =
        can(role, { user: ["update_self"] }) || can(role, { user: ["update"] });
      expect(canEditOwnProfile, `role "${role}" cannot edit its own profile`).toBe(true);
    }
  });
});
