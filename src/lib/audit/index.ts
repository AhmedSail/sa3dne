import { db } from "@/db";
import { auditLog } from "@/db/schema";

/**
 * Central audit logging service.
 *
 * Every important system action is recorded here so administrators have an
 * accountability trail. Two hard rules:
 *   1. Password/secret values must never be persisted — {@link redactSensitive}
 *      strips them from any old/new value snapshot before insert.
 *   2. Audit failures must never break the underlying business action and must
 *      never surface sensitive data. All writes are best-effort and swallow
 *      errors after logging them server-side.
 */

/** Canonical action identifiers. Keep these stable; the UI filters by them. */
export const AuditAction = {
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DEACTIVATE: "user.deactivate",
  USER_PASSWORD_CHANGE: "user.password_change",
  CAMP_CREATE: "camp.create",
  CAMP_UPDATE: "camp.update",
  CAMP_DEACTIVATE: "camp.deactivate",
  FAMILY_CREATE: "family.create",
  FAMILY_UPDATE: "family.update",
  FAMILY_DEACTIVATE: "family.deactivate",
  AID_TYPE_CREATE: "aid_type.create",
  AID_TYPE_UPDATE: "aid_type.update",
  AID_TYPE_DEACTIVATE: "aid_type.deactivate",
  PROVIDER_CREATE: "provider.create",
  PROVIDER_UPDATE: "provider.update",
  PROVIDER_DEACTIVATE: "provider.deactivate",
  CONTRIBUTION_CREATE: "contribution.create",
  CONTRIBUTION_SUBMIT: "contribution.submit",
  CONTRIBUTION_CANCEL: "contribution.cancel",
  RECEIPT_STATUS_CHANGE: "receipt.status_change",
  COMPLAINT_STATUS_CHANGE: "complaint.status_change",
  NEED_LEVEL_CHANGE: "need_level.change",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

/** The distinct action values, for building filter dropdowns. */
export const AUDIT_ACTION_VALUES = Object.values(AuditAction);

/** Field names that must never be written to an audit snapshot. */
const SENSITIVE_KEYS = [
  "password",
  "newpassword",
  "currentpassword",
  "oldpassword",
  "confirmpassword",
  "passwordhash",
  "hash",
  "salt",
  "token",
  "secret",
  "accesstoken",
  "refreshtoken",
  "idtoken",
];

/**
 * Returns a shallow-cloned copy of `value` with any sensitive fields removed
 * (case-insensitive, recursive). Non-objects are returned as-is. This is the
 * guardrail that keeps password values out of the audit log.
 */
export function redactSensitive<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => redactSensitive(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase().replace(/[_-]/g, ""))) {
        continue;
      }
      out[key] = redactSensitive(val);
    }
    return out as unknown as T;
  }
  return value;
}

/** Any object exposing header lookup — NextRequest, Request, or Headers. */
type HeaderBag = { get(name: string): string | null };
type RequestLike = { headers: HeaderBag };

/** Pulls best-effort client IP + user agent from a request's headers. */
export function requestMeta(req?: RequestLike): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  if (!req) return { ipAddress: null, userAgent: null };
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  const ipAddress =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ??
    h.get("x-real-ip") ??
    null;
  return { ipAddress, userAgent: h.get("user-agent") };
}

export interface LogAuditInput {
  userId?: string | null;
  action: AuditActionValue | string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Convenience: derive ipAddress/userAgent from a request's headers. */
  request?: RequestLike;
}

/**
 * Records an audit entry. Best-effort: never throws, so a logging failure can
 * never roll back or block the business action that triggered it.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const meta = input.request
      ? requestMeta(input.request)
      : { ipAddress: null, userAgent: null };
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValueJson:
        input.oldValue === undefined
          ? null
          : (redactSensitive(input.oldValue) as unknown),
      newValueJson:
        input.newValue === undefined
          ? null
          : (redactSensitive(input.newValue) as unknown),
      ipAddress: input.ipAddress ?? meta.ipAddress,
      userAgent: input.userAgent ?? meta.userAgent,
    });
  } catch (error) {
    // Do not surface the payload — it may contain business data.
    console.error(`Audit log write failed for action "${input.action}"`, error);
  }
}
