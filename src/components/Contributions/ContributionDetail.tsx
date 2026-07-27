"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { ContributionStatusBadge, LineStatusBadge } from "./status-badges";

type Line = {
  id: string;
  campId: string;
  campName: string;
  aidTypeId: string;
  aidTypeName: string;
  plannedQuantity: number;
  unit: string;
  plannedDeliveryDate: string | Date | null;
  status: string;
  actualReceivedQuantity: number | null;
  actualReceiptDate: string | Date | null;
  confirmationNotes: string | null;
  rejectionReason: string | null;
};

type Contribution = {
  id: string;
  status: string;
  notes: string | null;
  submittedAt: string | Date | null;
  createdAt: string | Date | null;
  providerName: string | null;
};

type CampOption = { id: string; name: string };
type AidTypeOption = { id: string; name: string; defaultUnit: string };

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ContributionDetail({
  contribution,
  lines: initialLines,
  camps,
  aidTypes,
  canEdit,
}: {
  contribution: Contribution;
  lines: Line[];
  camps: CampOption[];
  aidTypes: AidTypeOption[];
  canEdit: boolean;
}) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {t("contributionDetails")}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {contribution.providerName ?? "—"}
          </p>
        </div>
        <Link
          href="/dashboard/contributions"
          className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>

      {/* Header card */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark sm:grid-cols-3">
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("status")}</p>
          <div className="mt-1">
            <ContributionStatusBadge status={contribution.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("submittedAt")}</p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {formatDate(contribution.submittedAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("notes")}</p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {contribution.notes || "—"}
          </p>
        </div>
      </div>

      {/* Lines */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
        <div className="border-b border-stroke px-5 py-3.5 dark:border-dark-3">
          <h2 className="text-base font-bold text-dark dark:text-white">
            {t("contributionLines")}
          </h2>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm text-right">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("camps")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("aidType")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("plannedQuantity")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("receivedQuantity")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("status")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("notes")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {initialLines.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    {t("noLinesYet")}
                  </td>
                </tr>
              ) : (
                initialLines.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-1 dark:hover:bg-dark-2">
                    <td className="whitespace-nowrap px-4 py-3 text-dark dark:text-white">
                      {l.campName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {l.aidTypeName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {l.plannedQuantity} {l.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {l.actualReceivedQuantity ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <LineStatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-dark-4 dark:text-dark-6 text-sm max-w-xs truncate" title={l.rejectionReason || l.confirmationNotes || ""}>
                      {l.rejectionReason || l.confirmationNotes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
