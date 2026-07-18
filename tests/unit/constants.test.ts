import { describe, expect, it } from "vitest";
import {
  AID_MANAGEMENT_LEVEL,
  CAMP_STATUSES,
  COMPLAINT_STATUSES,
  COMPLAINT_TYPES,
  CONTRIBUTION_LINE_STATUSES,
  CONTRIBUTION_STATUSES,
  NEED_LEVELS,
  NOTIFICATION_STATUSES,
  PROVIDER_TYPES,
  USER_ROLES,
} from "@/lib/constants";
import {
  campStatus,
  complaintStatus,
  complaintType,
  contributionLineStatus,
  contributionStatus,
  needLevel,
  notificationStatus,
  providerType,
  userRole,
} from "@/db/schema/enums";
import { roles } from "@/lib/auth/modules/authorization/permissions";

/**
 * UT-CST-*: Constant / database enum parity.
 *
 * `src/lib/constants.ts` mirrors the PostgreSQL enums so they can be reused for
 * Zod validation and UI selects without importing the Drizzle schema
 * everywhere. A mirror that drifts from its source is worse than no mirror at
 * all: a role literal that no longer matches the database silently never
 * matches anything, and an authorization check built on it fails open or shut
 * with no error. These tests pin the two together.
 */

describe("constant / enum parity (UT-CST)", () => {
  it("UT-CST-01: USER_ROLES matches the user_role database enum", () => {
    expect(USER_ROLES).toEqual(userRole.enumValues);
  });

  it("UT-CST-02: CAMP_STATUSES matches the camp_status database enum", () => {
    expect(CAMP_STATUSES).toEqual(campStatus.enumValues);
  });

  it("UT-CST-03: NEED_LEVELS matches the need_level database enum", () => {
    expect(NEED_LEVELS).toEqual(needLevel.enumValues);
  });

  it("UT-CST-04: PROVIDER_TYPES matches the provider_type database enum", () => {
    expect(PROVIDER_TYPES).toEqual(providerType.enumValues);
  });

  it("UT-CST-05: CONTRIBUTION_STATUSES matches the contribution_status database enum", () => {
    expect(CONTRIBUTION_STATUSES).toEqual(contributionStatus.enumValues);
  });

  it("UT-CST-06: CONTRIBUTION_LINE_STATUSES matches the contribution_line_status enum", () => {
    expect(CONTRIBUTION_LINE_STATUSES).toEqual(contributionLineStatus.enumValues);
  });

  it("UT-CST-07: COMPLAINT_TYPES matches the complaint_type database enum", () => {
    expect(COMPLAINT_TYPES).toEqual(complaintType.enumValues);
  });

  it("UT-CST-08: COMPLAINT_STATUSES matches the complaint_status database enum", () => {
    expect(COMPLAINT_STATUSES).toEqual(complaintStatus.enumValues);
  });

  it("UT-CST-09: NOTIFICATION_STATUSES matches the notification_status database enum", () => {
    expect(NOTIFICATION_STATUSES).toEqual(notificationStatus.enumValues);
  });
});

describe("cross-layer role consistency (UT-CST)", () => {
  it("UT-CST-10: the permission matrix defines a role for every database role", () => {
    // If the database can store a role the matrix has never heard of, a user
    // holding it would authorize against nothing at all.
    expect(Object.keys(roles).sort()).toEqual([...userRole.enumValues].sort());
  });

  it("UT-CST-11: the administrator role literal is 'admin', as the routes check", () => {
    // Every protected route compares `session.user.role !== "admin"`. This is
    // the literal that must exist in the enum and the constant list.
    expect(userRole.enumValues).toContain("admin");
    expect(USER_ROLES).toContain("admin");
    expect(USER_ROLES).not.toContain("system_admin");
  });
});

describe("non-negotiable business rule (UT-CST)", () => {
  it("UT-CST-12: aid is managed at camp level only", () => {
    expect(AID_MANAGEMENT_LEVEL).toBe("camp");
  });
});
