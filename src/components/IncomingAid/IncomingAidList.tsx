"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useState } from "react";
import { LineStatusBadge } from "@/components/Contributions/status-badges";

type IncomingLine = {
  id: string;
  campName: string;
  aidTypeName: string;
  providerName: string;
  plannedQuantity: number;
  unit: string;
  plannedDeliveryDate: string | Date | null;
  status: string;
  submittedAt: string | Date | null;
};

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

const STATUS_FILTERS = [
  "all",
  "pending",
  "received",
  "partially_received",
  "not_received",
  "rejected",
] as const;

export default function IncomingAidList({
  lines,
  unassigned,
}: {
  lines: IncomingLine[];
  unassigned: boolean;
}) {
  const { t, language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? lines
      : lines.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("incomingAid")}
        </h1>
        <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
          {language === "ar"
            ? "المساعدات المُرسلة إلى مخيماتك بانتظار تأكيد الاستلام"
            : "Aid submitted to your camps awaiting receipt confirmation"}
        </p>
      </div>

      {unassigned ? (
        <div className="rounded-xl border border-stroke bg-white p-12 text-center text-sm text-dark-4 shadow-default dark:border-dark-3 dark:bg-gray-dark dark:text-dark-6">
          {t("noAssignedCamps")}
        </div>
      ) : (
        <>
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-white"
                    : "border border-stroke text-dark-4 hover:bg-gray-2 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
                }`}
              >
                {s === "all"
                  ? language === "ar"
                    ? "الكل"
                    : "All"
                  : t(
                      (
                        {
                          pending: "lineStatusPending",
                          received: "lineStatusReceived",
                          partially_received: "lineStatusPartial",
                          not_received: "lineStatusNotReceived",
                          rejected: "lineStatusRejected",
                        } as const
                      )[s] as any,
                    )}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto text-sm text-right">
                <thead>
                  <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("camps")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("aidType")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("provider")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("plannedQuantity")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("status")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-dark-3">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                      >
                        {t("noIncomingAid")}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((l) => (
                      <tr
                        key={l.id}
                        className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark dark:text-white">
                          {l.campName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                          {l.aidTypeName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                          {l.providerName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                          {l.plannedQuantity} {l.unit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <LineStatusBadge status={l.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Link
                            href={`/dashboard/incoming-aid/${l.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {t("confirmReceipt")}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
