import { auth } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/read-all
 * Marks all of the authenticated user's unread notifications as read.
 */
export async function POST(request: NextRequest) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await markAllNotificationsRead(session.user.id);
  return NextResponse.json({ success: true, count });
}
