import { guardApiSession } from "@/lib/auth/guard";
import { markAllNotificationsRead } from "@/lib/notifications/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/read-all
 * Marks all of the authenticated user's unread notifications as read.
 */
export async function POST(request: NextRequest) {
  const guard = await guardApiSession(request);
  if (!guard.ok) return guard.response;

  const count = await markAllNotificationsRead(guard.actor.id);
  return NextResponse.json({ success: true, count });
}
