import { createAccessControl } from "better-auth/plugins/access";

export const ac = createAccessControl({
  user: ["create", "read", "update", "update_self", "deactivate"],
  role: ["assign"],
  audit: ["read"],
  loginAttempt: ["read"],
  camp: ["create", "read", "update", "delete", "assign_manager"],
  // `manage_own` is the beneficiary self-service screen: it never widens to
  // another household, because the target record is resolved from the session
  // (see `src/lib/families/access.ts`), never from the request body.
  family: ["create", "read", "update", "delete", "transfer", "manage_own"],
  resource: ["create", "read", "update", "delete"],
  provider: ["create", "read", "update", "delete"],
  // The aid-type catalogue is centrally administered and read by everyone who
  // has to pick a type when contributing or receiving aid.
  aidType: ["create", "read", "update", "delete"],
  // A camp asks for aid; a provider commits to covering part or all of it.
  // Requesting and responding are deliberately separate actions so that no
  // single role can both raise a need and satisfy it.
  aidRequest: ["create", "read", "respond", "cancel"],
  distribution: ["create", "confirm", "read", "history_read"],
  contribution: ["create_official", "create_independent", "read", "receive"],
  classification: ["read"],
  alert: ["read", "acknowledge"],
  complaint: ["create", "read", "update_status", "track"],
  report: ["generate", "read_aggregated", "export"],
  dashboard: ["view"],
  sync: ["use", "conflict_resolve"],
});

export const roles = {
  admin: ac.newRole({
    user: ["create", "read", "update", "deactivate"],
    role: ["assign"],
    audit: ["read"],
    loginAttempt: ["read"],
    camp: ["create", "read", "update", "delete", "assign_manager"],
    family: ["create", "read", "update", "delete", "transfer"],
    resource: ["create", "read", "update", "delete"],
    provider: ["create", "read", "update", "delete"],
    aidType: ["create", "read", "update", "delete"],
    aidRequest: ["create", "read", "respond", "cancel"],
    distribution: ["create", "confirm", "read", "history_read"],
    contribution: ["read", "receive"],
    classification: ["read"],
    alert: ["read", "acknowledge"],
    complaint: ["read", "update_status"],
    report: ["generate", "read_aggregated", "export"],
    dashboard: ["view"],
    sync: ["use", "conflict_resolve"],
  }),

  camp_manager: ac.newRole({
    user: ["update_self"],
    camp: ["read", "update"],
    family: ["create", "read", "update", "delete", "transfer"],
    resource: ["create", "read", "update", "delete"],
    // Read-only: a manager must be able to see who is delivering aid to their
    // camp, but the provider directory itself is administered centrally.
    provider: ["read"],
    aidType: ["read"],
    aidRequest: ["create", "read", "cancel"],
    distribution: ["create", "confirm", "read", "history_read"],
    contribution: ["read", "receive"],
    classification: ["read"],
    alert: ["read", "acknowledge"],
    complaint: ["read", "update_status"],
    report: ["generate", "export"],
    dashboard: ["view"],
    sync: ["use", "conflict_resolve"],
  }),

  org_representative: ac.newRole({
    user: ["update_self"],
    camp: ["read"],
    // `agg` scope in the matrix: population totals for reporting, never the
    // household records themselves. Enforced by `canReadRecords` in the guard.
    family: ["read"],
    resource: ["read"],
    aidType: ["read"],
    aidRequest: ["read", "respond"],
    distribution: ["read", "history_read"],
    contribution: ["create_official", "read"],
    classification: ["read"],
    alert: ["read"],
    report: ["generate", "read_aggregated", "export"],
    dashboard: ["view"],
  }),

  independent_initiator: ac.newRole({
    user: ["update_self"],
    camp: ["read"],
    resource: ["read"],
    aidType: ["read"],
    aidRequest: ["read", "respond"],
    contribution: ["create_independent", "read"],
    classification: ["read"],
    alert: ["read"],
    dashboard: ["view"],
  }),

  beneficiary: ac.newRole({
    user: ["update_self"],
    family: ["manage_own"],
    complaint: ["create", "read", "track"],
  }),

  // Fallback / legacy role
  user: ac.newRole({
    user: ["update_self"],
    complaint: ["create", "read", "track"],
  }),
} as const;

export type AppRole = keyof typeof roles;
