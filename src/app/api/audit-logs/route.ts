import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { guardApi } from "@/lib/auth/guard";
import { and, desc, eq, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/audit-logs
 * Admin-only. Lists audit entries newest-first with optional filters:
 *   ?action=<action>   exact action match
 *   ?entityType=<type> exact entity-type match
 *   ?limit=<n>         page size (default 50, max 200)
 *   ?before=<iso>      keyset pagination: rows created strictly before this time
 */
export async function GET(request: NextRequest) {
  // Only the System Administrator holds `audit:read`.
  const guard = await guardApi(request, "audit", "read");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const entityType = searchParams.get("entityType");
  const before = searchParams.get("before");
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 50, 1),
    200,
  );

  const conditions = [];
  if (action) conditions.push(eq(auditLog.action, action));
  if (entityType) conditions.push(eq(auditLog.entityType, entityType));
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      conditions.push(lt(auditLog.createdAt, beforeDate));
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLog.id,
      userId: auditLog.userId,
      userName: user.name,
      userEmail: user.email,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      oldValueJson: auditLog.oldValueJson,
      newValueJson: auditLog.newValueJson,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({ items, nextCursor });
}
