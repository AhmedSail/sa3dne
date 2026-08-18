import { db } from "@/db";
import {
  aidContribution,
  aidContributionLine,
  aidProvider,
  aidType,
  camp,
  campAssignment,
  family,
  familyUpdateRequest,
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
 * Notifies everyone who needs to act on a submitted contribution.
 *
 * For each distinct camp in the submitted lines, every assigned Camp Manager is
 * told about their own camp specifically. Administrators oversee all camps, so
 * they always receive one summary notification — not only, as before, when a
 * camp happened to have no manager.
 */
export async function notifyOfContributionSubmission(
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

    const rows: CreateNotificationInput[] = [];
    const unmanagedCamps: string[] = [];

    for (const campId of campIds) {
      const campName = campNames.get(campId)!;
      const managers = managersByCamp.get(campId) ?? [];
      if (managers.length === 0) unmanagedCamps.push(campName);

      for (const managerId of managers) {
        rows.push({
          userId: managerId,
          title: "مساعدات جديدة بانتظار الاستلام",
          message: `${providerName} أرسل مساعدات إلى ${campName}.`,
          entityType: "contribution",
          entityId: contributionId,
          link: "/dashboard/incoming-aid",
        });
      }
    }

    // Administrators oversee every camp, so they are always told — with the
    // unmanaged camps called out, since nobody else will see those lines.
    const adminIds = await getAdminUserIds();
    const campList = campIds.map((id) => campNames.get(id)!).join("، ");
    const warning = unmanagedCamps.length
      ? ` تنبيه: لا يوجد مدير معيّن لـ ${unmanagedCamps.join("، ")}.`
      : "";

    for (const adminId of adminIds) {
      rows.push({
        userId: adminId,
        title: "مساهمة جديدة مُرسلة",
        message: `${providerName} أرسل مساعدات إلى ${campList}.${warning}`,
        entityType: "contribution",
        entityId: contributionId,
        link: `/dashboard/contributions/${contributionId}`,
      });
    }

    await createManyNotifications(rows);
  } catch (error) {
    console.error("Failed to notify of contribution submission", error);
  }
}

/**
 * Notifies the receiving side that a provider withdrew a contribution before
 * anything was confirmed, so nobody keeps waiting for aid that is not coming.
 */
export async function notifyOfContributionCancellation(
  contributionId: string,
): Promise<void> {
  try {
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

    const assignments = await db
      .select({ userId: campAssignment.userId })
      .from(campAssignment)
      .where(inArray(campAssignment.campId, campIds));

    const recipients = new Set<string>([
      ...assignments.map((a) => a.userId),
      ...(await getAdminUserIds()),
    ]);
    if (recipients.size === 0) return;

    const campList = campIds.map((id) => campNames.get(id)!).join("، ");

    await createManyNotifications(
      [...recipients].map((userId) => ({
        userId,
        title: "تم إلغاء مساهمة",
        message: `${providerName} ألغى المساعدات المُرسلة إلى ${campList}.`,
        entityType: "contribution",
        entityId: contributionId,
        link: "/dashboard/incoming-aid",
      })),
    );
  } catch (error) {
    console.error("Failed to notify of contribution cancellation", error);
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

const FAMILY_REQUEST_LABEL: Record<string, string> = {
  add_member: "إضافة فرد",
  remove_member: "حذف فرد",
  update_family_info: "تعديل بيانات العائلة",
  update_member: "تعديل بيانات فرد",
};

/**
 * Notifies the reviewers of a newly submitted family update request.
 *
 * Recipients are the Camp Managers assigned to the family's camp plus every
 * System Administrator — an administrator reviews across all camps, so they are
 * always addressed, not only as a fallback for an unmanaged camp.
 */
export async function notifyReviewersOfFamilyRequest(
  requestId: string,
): Promise<void> {
  try {
    const [request] = await db
      .select({
        id: familyUpdateRequest.id,
        type: familyUpdateRequest.type,
        requestedById: familyUpdateRequest.requestedById,
        campId: family.campId,
        campName: camp.name,
        headName: family.headName,
      })
      .from(familyUpdateRequest)
      .innerJoin(family, eq(familyUpdateRequest.familyId, family.id))
      .leftJoin(camp, eq(family.campId, camp.id))
      .where(eq(familyUpdateRequest.id, requestId))
      .limit(1);

    if (!request) return;

    const managers = await db
      .select({ userId: campAssignment.userId })
      .from(campAssignment)
      .where(eq(campAssignment.campId, request.campId));

    const adminIds = await getAdminUserIds();

    // A manager who is also an administrator must not receive it twice.
    const recipients = new Set<string>([
      ...managers.map((m) => m.userId),
      ...adminIds,
    ]);
    // The requester reviewing their own request would be meaningless.
    recipients.delete(request.requestedById);
    if (recipients.size === 0) return;

    const label = FAMILY_REQUEST_LABEL[request.type] ?? "تحديث بيانات";
    const campSuffix = request.campName ? ` — ${request.campName}` : "";

    await createManyNotifications(
      [...recipients].map((userId) => ({
        userId,
        title: "طلب تحديث عائلة جديد",
        message: `${label}: عائلة ${request.headName}${campSuffix} بانتظار المراجعة.`,
        entityType: "family_update_request",
        entityId: request.id,
        link: "/dashboard/family-requests",
      })),
    );
  } catch (error) {
    console.error("Failed to notify reviewers of family request", error);
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
