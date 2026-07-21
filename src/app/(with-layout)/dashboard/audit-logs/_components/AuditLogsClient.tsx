"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/lib/i18n/language-context";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

interface AuditRow {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValueJson: unknown;
  newValueJson: unknown;
  ipAddress: string | null;
  createdAt: string | Date;
}

export default function AuditLogsClient({
  logs,
  actions,
  selectedAction,
}: {
  logs: AuditRow[];
  actions: string[];
  selectedAction: string;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const align = language === "ar" ? "text-right" : "text-left";

  function onActionChange(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("action", value);
    router.push(`/dashboard/audit-logs${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <>
      <Breadcrumb pageName={t("auditLogs")} />

      <div className="rounded-[10px] border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:px-7.5">
        <div className="mb-6">
          <select
            value={selectedAction}
            onChange={(e) => onActionChange(e.target.value)}
            className={`w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 sm:w-1/3 ${align}`}
          >
            <option value="">{t("allActions")}</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-dark-2">
                <th className={`min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white ${align}`}>
                  {t("auditDate")}
                </th>
                <th className={`min-w-[160px] px-4 py-4 font-medium text-dark dark:text-white ${align}`}>
                  {t("auditUser")}
                </th>
                <th className={`min-w-[160px] px-4 py-4 font-medium text-dark dark:text-white ${align}`}>
                  {t("auditAction")}
                </th>
                <th className={`min-w-[140px] px-4 py-4 font-medium text-dark dark:text-white ${align}`}>
                  {t("auditEntity")}
                </th>
                <th className={`min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white ${align}`}>
                  {t("auditIp")}
                </th>
                <th className="px-4 py-4 text-center font-medium text-dark dark:text-white">
                  {t("auditDetails")}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-dark-4 dark:text-dark-6"
                  >
                    {t("noAuditLogs")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const hasDetails =
                    log.oldValueJson != null || log.newValueJson != null;
                  const isOpen = expanded === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr>
                        <td
                          className={`border-b border-[#eee] px-4 py-5 dark:border-dark-3 ${align}`}
                          dir="ltr"
                        >
                          {dayjs(log.createdAt)
                            .locale(language === "ar" ? "ar" : "en")
                            .format("YYYY-MM-DD HH:mm")}
                        </td>
                        <td className={`border-b border-[#eee] px-4 py-5 dark:border-dark-3 ${align}`}>
                          {log.userName ? (
                            <>
                              <p className="text-dark dark:text-white">
                                {log.userName}
                              </p>
                              {log.userEmail && (
                                <p className="text-sm text-dark-4">
                                  {log.userEmail}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-dark-4">{t("system")}</span>
                          )}
                        </td>
                        <td className={`border-b border-[#eee] px-4 py-5 dark:border-dark-3 ${align}`}>
                          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className={`border-b border-[#eee] px-4 py-5 dark:border-dark-3 ${align}`}>
                          <p className="text-dark dark:text-white">
                            {log.entityType}
                          </p>
                          {log.entityId && (
                            <p className="truncate text-xs text-dark-4" dir="ltr">
                              {log.entityId}
                            </p>
                          )}
                        </td>
                        <td
                          className={`border-b border-[#eee] px-4 py-5 dark:border-dark-3 ${align}`}
                          dir="ltr"
                        >
                          {log.ipAddress ?? "—"}
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 text-center dark:border-dark-3">
                          {hasDetails ? (
                            <button
                              onClick={() =>
                                setExpanded(isOpen ? null : log.id)
                              }
                              className="text-primary hover:underline"
                            >
                              {isOpen ? "−" : "+"}
                            </button>
                          ) : (
                            <span className="text-dark-4">—</span>
                          )}
                        </td>
                      </tr>
                      {isOpen && hasDetails && (
                        <tr>
                          <td
                            colSpan={6}
                            className="border-b border-[#eee] bg-gray-1 px-4 py-4 dark:border-dark-3 dark:bg-dark-2"
                          >
                            <div className="grid gap-4 sm:grid-cols-2" dir="ltr">
                              <div>
                                <p className="mb-1 text-xs font-medium text-dark-4">
                                  old
                                </p>
                                <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-dark-3">
                                  {JSON.stringify(log.oldValueJson, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-medium text-dark-4">
                                  new
                                </p>
                                <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-dark-3">
                                  {JSON.stringify(log.newValueJson, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
