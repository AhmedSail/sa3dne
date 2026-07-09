import { createAccessControl } from "better-auth/plugins/access";

export const ac = createAccessControl({
  user: ["create", "read", "update", "update_self", "deactivate"],
  role: ["assign"],
  audit: ["read"],
  loginAttempt: ["read"],
  camp: ["create", "read", "update", "delete", "assign_manager"],
  family: ["create", "read", "update", "delete", "transfer"],
  resource: ["create", "read", "update", "delete"],
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
    family: ["read"],
    resource: ["read"],
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
    contribution: ["create_independent", "read"],
    classification: ["read"],
    alert: ["read"],
    dashboard: ["view"],
  }),

  beneficiary: ac.newRole({
    user: ["update_self"],
    complaint: ["create", "read", "track"],
  }),

  // Fallback / legacy role
  user: ac.newRole({
    user: ["update_self"],
    complaint: ["create", "read", "track"],
  }),
} as const;

export type AppRole = keyof typeof roles;
