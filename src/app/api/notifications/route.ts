import { guardApiSession } from "@/lib/auth/guard";
import {
  getUnreadCount,
  listNotifications,
} from "@/lib/notifications/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/notifications
 * Returns the authenticated user's notifications (newest first) and their
 * unread count. Always scoped to the acting user.
 *   ?status=unread|read  optional filter
 *   ?limit=<n>           page size (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  const guard = await guardApiSession(request);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam === "unread" || statusParam === "read" ? statusParam : undefined;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);

  const [items, unreadCount] = await Promise.all([
    listNotifications(guard.actor.id, { status, limit }),
    getUnreadCount(guard.actor.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}
