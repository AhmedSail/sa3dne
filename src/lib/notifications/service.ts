import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
  campAssignment,
  notification,
  user,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

/**
 * Notification service.
 *
 * Creates and reads in-app notifications. Every read is scoped to the acting
 * user's id, so a user can only ever see rows addressed to them. Writes are
 * best-effort: a notification failure must never break the business action that
 * triggered it (contribution submission / receipt confirmation).
 */

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  link?: string | null;
}

/** Inserts one notification row. Returns the new id, or null on failure. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<string | null> {
  try {
    const id = crypto.randomUUID();
    await db.insert(notification).values({
      id,
      userId: input.userId,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      link: input.link ?? null,
      status: "unread",
    });
    return id;
  } catch (error) {
    console.error("Failed to create notification", error);
    return null;
  }
}

/** Inserts many notifications in one statement. Best-effort. */
async function createManyNotifications(
  rows: CreateNotificationInput[],
): Promise<void> {
  if (rows.length === 0) return;
  try {
    await db.insert(notification).values(
      rows.map((r) => ({
        id: crypto.randomUUID(),
        userId: r.userId,
        title: r.title,
        message: r.message,
        entityType: r.entityType ?? null,
        entityId: r.entityId ?? null,
        link: r.link ?? null,
        status: "unread" as const,
      })),
    );
  } catch (error) {
    console.error("Failed to create notifications batch", error);
  }
}

/** Ids of all active System Administrators (fallback recipients). */
async function getAdminUserIds(): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"));
  return rows.map((r) => r.id);
}

/**
 * Notifies the relevant Camp Managers that a contribution was submitted.
 *
 * For each distinct camp in the submitted lines, every assigned Camp Manager
 * receives one unread notification. If a camp has no assigned manager, the
 * System Administrator(s) are notified as a fallback so nothing goes unseen.
 */
export async function notifyCampManagersOfSubmission(
  contributionId: string,
): Promise<void> {
  try {
    // Resolve the provider name and the set of camps in this contribution.
    const lines = await db
      .select({
        campId: aidContributionLine.campId,
        campName: camp.name,
        providerName: aidProvider.name,
      })
      .from(aidContributionLine)
      .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
      .innerJoin(
        aidContribution,
        eq(aidContributionLine.contributionId, aidContribution.id),
      )
      .innerJoin(aidProvider, eq(aidContribution.providerId, aidProvider.id))
      .where(eq(aidContributionLine.contributionId, contributionId));

    if (lines.length === 0) return;

    const providerName = lines[0].providerName;
    const campNames = new Map<string, string>();
    for (const l of lines) campNames.set(l.campId, l.campName);
    const campIds = [...campNames.keys()];

    // Managers assigned to any of these camps.
    const assignments = await db
      .select({ campId: campAssignment.campId, userId: campAssignment.userId })
      .from(campAssignment)
      .where(inArray(campAssignment.campId, campIds));

    const managersByCamp = new Map<string, string[]>();
    for (const a of assignments) {
      const list = managersByCamp.get(a.campId) ?? [];
      list.push(a.userId);
      managersByCamp.set(a.campId, list);
    }

    const link = `/dashboard/incoming-aid`;
    const rows: CreateNotificationInput[] = [];
    let anyUnmanaged = false;

    for (const campId of campIds) {
      const campName = campNames.get(campId)!;
      const managers = managersByCamp.get(campId) ?? [];
      if (managers.length === 0) {
        anyUnmanaged = true;
        continue;
      }
      for (const managerId of managers) {
        rows.push({
          userId: managerId,
          title: "New aid submitted",
          message: `${providerName} submitted aid for ${campName}.`,
          entityType: "contribution",
          entityId: contributionId,
          link,
        });
      }
    }

    // Fallback: notify admins about any camp that has no manager.
    if (anyUnmanaged) {
      const adminIds = await getAdminUserIds();
      for (const adminId of adminIds) {
        rows.push({
          userId: adminId,
          title: "New aid submitted (unassigned camp)",
          message: `${providerName} submitted aid for a camp with no assigned manager.`,
          entityType: "contribution",
          entityId: contributionId,
          link,
        });
      }
    }

    await createManyNotifications(rows);
  } catch (error) {
    console.error("Failed to notify camp managers of submission", error);
  }
}

const RECEIPT_STATUS_LABEL: Record<string, string> = {
  received: "received",
  partially_received: "partially received",
  not_received: "not received",
  rejected: "rejected",
};

/**
 * Notifies the owning provider that one of their contribution lines had its
 * receipt status changed by a Camp Manager. Only meaningful terminal statuses
 * (received / partially / not received / rejected) trigger a notification.
 */
export async function notifyProviderOfReceipt(lineId: string): Promise<void> {
  try {
    const [row] = await db
      .select({
        lineId: aidContributionLine.id,
        contributionId: aidContributionLine.contributionId,
        status: aidContributionLine.status,
        campName: camp.name,
        aidTypeName: aidType.name,
        linkedUserId: aidProvider.linkedUserId,
      })
      .from(aidContributionLine)
      .innerJoin(camp, eq(aidContributionLine.campId, camp.id))
      .innerJoin(aidType, eq(aidContributionLine.aidTypeId, aidType.id))
      .innerJoin(
        aidContribution,
        eq(aidContributionLine.contributionId, aidContribution.id),
      )
      .innerJoin(aidProvider, eq(aidContribution.providerId, aidProvider.id))
      .where(eq(aidContributionLine.id, lineId))
      .limit(1);

    if (!row || !row.linkedUserId) return;

    const label = RECEIPT_STATUS_LABEL[row.status];
    if (!label) return;

    await createNotification({
      userId: row.linkedUserId,
      title: "Receipt status updated",
      message: `Your ${row.aidTypeName} for ${row.campName} was marked "${label}".`,
      entityType: "contribution_line",
      entityId: row.lineId,
      link: `/dashboard/my-contributions?line=${row.lineId}`,
    });
  } catch (error) {
    console.error("Failed to notify provider of receipt", error);
  }
}

export interface ListNotificationsOptions {
  status?: "unread" | "read";
  limit?: number;
}

/** Lists a user's notifications, newest first. Always scoped to `userId`. */
export async function listNotifications(
  userId: string,
  opts: ListNotificationsOptions = {},
) {
  const conditions = [eq(notification.userId, userId)];
  if (opts.status) conditions.push(eq(notification.status, opts.status));

  return db
    .select()
    .from(notification)
    .where(and(...conditions))
    .orderBy(desc(notification.createdAt))
    .limit(opts.limit ?? 50);
}

/** Count of unread notifications for a user. */
export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.status, "unread")),
    );
  return row?.count ?? 0;
}

/**
 * Marks a single notification as read. Scoped: the update only applies when the
 * row belongs to `userId`, so a user cannot mutate another user's notification.
 * Returns true when a row was updated.
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const updated = await db
    .update(notification)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId),
        eq(notification.status, "unread"),
      ),
    )
    .returning({ id: notification.id });
  return updated.length > 0;
}

/** Marks all of a user's unread notifications as read. Returns the count. */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const updated = await db
    .update(notification)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(eq(notification.userId, userId), eq(notification.status, "unread")),
    )
    .returning({ id: notification.id });
  return updated.length;
}
