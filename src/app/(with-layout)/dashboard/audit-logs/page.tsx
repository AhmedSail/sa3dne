import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AUDIT_ACTION_VALUES } from "@/lib/audit";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AuditLogsClient from "./_components/AuditLogsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سجل التدقيق",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }
  // Only the System Administrator can view audit logs.
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const resolved = await searchParams;
  const action =
    typeof resolved.action === "string" && resolved.action ? resolved.action : undefined;

  const where = action ? and(eq(auditLog.action, action)) : undefined;

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
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return (
    <AuditLogsClient
      logs={rows}
      actions={AUDIT_ACTION_VALUES}
      selectedAction={action ?? ""}
    />
  );
}
