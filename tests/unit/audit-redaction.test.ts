import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_VALUES, redactSensitive, requestMeta } from "@/lib/audit";

/**
 * UT-AUD-*: Audit snapshot redaction.
 *
 * The single hard rule from phase 06: password values must never reach the
 * audit log. `redactSensitive` is the guardrail every snapshot passes through
 * before insert, so it is tested here in isolation — no database, no session.
 */

describe("redactSensitive (UT-AUD)", () => {
  it("UT-AUD-01: strips password-like fields regardless of casing or separators", () => {
    const input = {
      email: "user@example.com",
      password: "hunter2",
      newPassword: "s3cret",
      current_password: "old",
      "confirm-password": "s3cret",
      passwordHash: "$2b$...",
    };

    const out = redactSensitive(input) as Record<string, unknown>;

    expect(out).toEqual({ email: "user@example.com" });
    expect(JSON.stringify(out)).not.toContain("hunter2");
    expect(JSON.stringify(out)).not.toContain("s3cret");
  });

  it("UT-AUD-02: redacts tokens and secrets nested in objects and arrays", () => {
    const input = {
      user: { id: "u1", accessToken: "abc", refreshToken: "def" },
      sessions: [{ token: "t1" }, { token: "t2", ip: "1.2.3.4" }],
    };

    const out = redactSensitive(input) as any;

    expect(out.user).toEqual({ id: "u1" });
    expect(out.sessions).toEqual([{}, { ip: "1.2.3.4" }]);
  });

  it("UT-AUD-03: leaves non-sensitive scalars and structures intact", () => {
    expect(redactSensitive({ status: "submitted", lineCount: 3 })).toEqual({
      status: "submitted",
      lineCount: 3,
    });
    expect(redactSensitive("plain")).toBe("plain");
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(null)).toBe(null);
  });

  it("UT-AUD-04: exposes a stable, non-empty set of auditable actions", () => {
    // The UI filter dropdown depends on these; guard against an empty export.
    expect(AUDIT_ACTION_VALUES.length).toBeGreaterThan(0);
    expect(AUDIT_ACTION_VALUES).toContain("user.password_change");
    expect(AUDIT_ACTION_VALUES).toContain("contribution.submit");
    expect(AUDIT_ACTION_VALUES).toContain("receipt.status_change");
  });
});

describe("requestMeta (UT-AUD)", () => {
  it("UT-AUD-05: prefers the first x-forwarded-for hop and reads the user agent", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "user-agent": "vitest",
    });

    expect(requestMeta({ headers })).toEqual({
      ipAddress: "203.0.113.7",
      userAgent: "vitest",
    });
  });

  it("UT-AUD-06: returns nulls when no request is supplied", () => {
    expect(requestMeta()).toEqual({ ipAddress: null, userAgent: null });
  });
});
