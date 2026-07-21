import { auth } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notifications/service";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/notifications/[id]/read
 * Marks one of the authenticated user's notifications as read. The update is
 * scoped to the acting user, so a user cannot mark another user's notification.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await auth.api.getSession({ headers: request.headers })) as any;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updated = await markNotificationRead(session.user.id, id);
  if (!updated) {
    // Either it does not exist, is already read, or belongs to another user.
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
