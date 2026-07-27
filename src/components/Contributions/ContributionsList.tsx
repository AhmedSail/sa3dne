"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { ContributionStatusBadge } from "./status-badges";

type ContributionRow = {
  id: string;
  providerName: string | null;
  status: string;
  displayStatus?: string;
  notes: string | null;
  submittedAt: string | Date | null;
  createdAt: string | Date | null;
};

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ContributionsList({
  contributions,
  canCreate,
  showProvider,
  titleKey,
}: {
  contributions: ContributionRow[];
  canCreate: boolean;
  showProvider: boolean;
  titleKey: "contributionsList" | "myContributions";
}) {
  const { t, language } = useLanguage();
  const title = t(titleKey);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {language === "ar"
              ? "مساهمات المساعدات على مستوى المخيم وحالتها"
              : "Camp-level aid contributions and their status"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/contributions/new"
            className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
          >
            {t("newContribution")}
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm text-right">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                {showProvider && (
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("provider")}
                  </th>
                )}
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("status")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("submittedAt")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("notes")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {contributions.length === 0 ? (
                <tr>
                  <td
                    colSpan={showProvider ? 5 : 4}
                    className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    {t("noContributions")}
                  </td>
                </tr>
              ) : (
                contributions.map((c) => (
                  <tr
                    key={c.id}
                    className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                  >
                    {showProvider && (
                      <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {c.providerName ?? "—"}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <ContributionStatusBadge status={c.displayStatus || c.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {formatDate(c.submittedAt)}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {c.notes || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Link
                        href={`/dashboard/contributions/${c.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("contributionDetails")}
                      </Link>
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
