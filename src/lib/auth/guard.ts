import { db } from "@/db";
import { campAssignment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
// Imported through the barrel so route tests that mock `@/lib/auth` also
// intercept the session lookup performed here.
import { auth } from "@/lib/auth";
import { ac, roles, type AppRole } from "./modules/authorization/permissions";

/**
 * Central server-side authorization guard.
 *
 * Every protected page and route handler resolves the acting user through this
 * module instead of hand-rolling `session.user.role === "..."` comparisons.
 * The rules come from the access-control table in
 * `./modules/authorization/permissions`, which is the single source of truth —
 * a role that is not granted a permission there is denied, so the default is
 * always deny rather than "fall through and return everything".
 */

type Statements = typeof ac.statements;

export type Resource = keyof Statements;
export type Action<R extends Resource> = Statements[R][number];

export type Actor = {
  id: string;
  role: AppRole;
  name: string;
  email: string;
  /** Primary camp assigned on the user record; see `getCampScope`. */
  campId: string | null;
};

/** Camp ids an actor may touch. `null` means unrestricted. */
export type CampScope = string[] | null;

export type GuardContext = {
  actor: Actor;
  campIds: CampScope;
};

type ApiGuard =
  | ({ ok: true } & GuardContext)
  | { ok: false; response: NextResponse };

/**
 * Result of a session-only guard. It deliberately carries no camp scope:
 * these endpoints key off the acting user's own id, so resolving assignments
 * would be a query nobody reads.
 */
type ApiSessionGuard =
  | { ok: true; actor: Actor }
  | { ok: false; response: NextResponse };

function isAppRole(role: unknown): role is AppRole {
  return typeof role === "string" && role in roles;
}

/**
 * Returns true when the role is granted `action` on `resource`.
 * An unknown role is denied everything.
 */
export function can<R extends Resource>(
  role: unknown,
  resource: R,
  action: Action<R>,
): boolean {
  if (!isAppRole(role)) return false;
  return roles[role].authorize({ [resource]: [action] } as never).success;
}

/**
 * Roles that hold their read permissions at aggregate scope (`agg` in
 * `.claude/Roles_and_Permissions_Matrix_EN.md` §3). They may see population
 * totals in reports and dashboards, but never the underlying records — §7 of
 * the matrix requires that a family head's ID data never appear in aggregated
 * output.
 */
const AGGREGATE_ONLY_ROLES: ReadonlySet<AppRole> = new Set([
  "org_representative",
  "independent_initiator",
]);

/**
 * Whether the role may read individual records of `resource`, as opposed to
 * aggregate figures. Endpoints returning rows that identify a household must
 * use this instead of a plain `can(..., "read")`.
 */
export function canReadRecords(role: unknown, resource: Resource): boolean {
  if (!isAppRole(role)) return false;
  if (AGGREGATE_ONLY_ROLES.has(role)) return false;
  return can(role, resource, "read" as Action<typeof resource>);
}

/**
 * Resolves the authenticated actor, or null when there is no valid session.
 * A banned account is treated as unauthenticated.
 */
export async function getActor(requestHeaders?: Headers): Promise<Actor | null> {
  const session = (await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  })) as {
    user?: {
      id: string;
      name: string;
      email: string;
      role?: string;
      campId?: string | null;
      banned?: boolean | null;
    };
  } | null;

  const user = session?.user;
  if (!user || user.banned) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: isAppRole(user.role) ? user.role : "user",
    campId: user.campId ?? null,
  };
}

/**
 * Camp ids the actor is allowed to see data for.
 *
 * - Camp Manager: the camps they are assigned to (`camp_assignment` rows plus
 *   the primary `user.camp_id` set by an administrator). An empty array means
 *   "assigned to nothing", which must produce an empty result set — never all.
 * - Any other role holding `camp:read` (admin, organisation representative,
 *   independent initiator): unrestricted.
 * - Everyone else: `[]`.
 */
export async function getCampScope(actor: Actor): Promise<CampScope> {
  if (actor.role === "camp_manager") {
    const rows = await db
      .select({ campId: campAssignment.campId })
      .from(campAssignment)
      .where(eq(campAssignment.userId, actor.id));

    const ids = new Set(rows.map((r) => r.campId));
    if (actor.campId) ids.add(actor.campId);
    return [...ids];
  }

  return can(actor.role, "camp", "read") ? null : [];
}

export type GuardOptions = {
  /**
   * Set on any endpoint that returns individual records rather than totals.
   * Roles holding the permission at aggregate scope only are then refused.
   */
  records?: boolean;
};

function isAllowed<R extends Resource>(
  actor: Actor,
  resource: R,
  action: Action<R>,
  options: GuardOptions,
): boolean {
  if (!can(actor.role, resource, action)) return false;
  if (options.records && !canReadRecords(actor.role, resource)) return false;
  return true;
}

/** True when `campId` falls inside the actor's camp scope. */
export function isWithinCampScope(campIds: CampScope, campId: string): boolean {
  return campIds === null || campIds.includes(campId);
}

/**
 * Guard for route handlers. Returns the actor and camp scope, or a ready-made
 * 401/403 response to return from the handler.
 *
 *   const guard = await guardApi(request, "family", "read");
 *   if (!guard.ok) return guard.response;
 */
export async function guardApi<R extends Resource>(
  request: Request,
  resource: R,
  action: Action<R>,
  options: GuardOptions = {},
): Promise<ApiGuard> {
  const actor = await getActor(request.headers);
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAllowed(actor, resource, action, options)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, actor, campIds: await getCampScope(actor) };
}

/**
 * Guard for route handlers that only require an authenticated caller — use it
 * where the data is keyed by the acting user's own id (notifications, own
 * profile), so there is no resource permission to check.
 */
export async function guardApiSession(request: Request): Promise<ApiSessionGuard> {
  const actor = await getActor(request.headers);
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, actor };
}

/**
 * Guard for server components. Redirects to sign-in when unauthenticated and
 * to the dashboard root when the role lacks the permission.
 */
export async function guardPage<R extends Resource>(
  resource: R,
  action: Action<R>,
  options: GuardOptions = {},
): Promise<GuardContext> {
  const actor = await getActor();
  if (!actor) redirect("/auth/sign-in");

  if (!isAllowed(actor, resource, action, options)) redirect("/dashboard");

  return { actor, campIds: await getCampScope(actor) };
}

/** Guard for server components that only require an authenticated visitor. */
export async function guardPageSession(): Promise<{ actor: Actor }> {
  const actor = await getActor();
  if (!actor) redirect("/auth/sign-in");
  return { actor };
}
