import { guardApiSession } from "@/lib/auth/guard";
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
  const guard = await guardApiSession(request);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const updated = await markNotificationRead(guard.actor.id, id);
  if (!updated) {
    // Either it does not exist, is already read, or belongs to another user.
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
