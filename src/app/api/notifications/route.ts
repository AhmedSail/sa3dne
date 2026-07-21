import { auth } from "@/lib/auth";
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
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam === "unread" || statusParam === "read" ? statusParam : undefined;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);

  const [items, unreadCount] = await Promise.all([
    listNotifications(session.user.id, { status, limit }),
    getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}
