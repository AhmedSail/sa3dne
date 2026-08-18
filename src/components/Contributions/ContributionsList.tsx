"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ContributionStatusBadge } from "./status-badges";

type CampRef = { id: string; name: string };

type ContributionRow = {
  id: string;
  providerName: string | null;
  status: string;
  displayStatus?: string;
  /** True while every line is still awaiting confirmation. */
  cancellable?: boolean;
  camps?: CampRef[];
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
  camps = [],
}: {
  contributions: ContributionRow[];
  canCreate: boolean;
  showProvider: boolean;
  titleKey: "contributionsList" | "myContributions";
  /** Camps this list can be filtered by. Empty hides the filter entirely. */
  camps?: CampRef[];
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const title = t(titleKey);

  const [campFilter, setCampFilter] = useState<string>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const showCamps = contributions.some((c) => c.camps?.length);

  const visible = useMemo(
    () =>
      campFilter === "all"
        ? contributions
        : contributions.filter((c) =>
            c.camps?.some((camp) => camp.id === campFilter),
          ),
    [contributions, campFilter],
  );

  async function cancelContribution(id: string) {
    if (!window.confirm(t("confirmCancelContribution"))) return;

    setCancelling(id);
    try {
      const res = await fetch(`/api/contributions/${id}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        // 409 means a camp confirmed a line while this page was open.
        throw new Error(
          res.status === 409 ? t("cancelOnlyBeforeConfirmation") : t("errCancelFailed"),
        );
      }
      toast.success(t("contributionCancelled"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errCancelFailed"));
    } finally {
      setCancelling(null);
    }
  }

  const columnCount =
    3 + (showProvider ? 1 : 0) + (showCamps ? 1 : 0) + 1; /* actions */

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

      {camps.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="camp-filter"
            className="text-sm font-medium text-dark-4 dark:text-dark-6"
          >
            {t("filterByCamp")}
          </label>
          <select
            id="camp-filter"
            value={campFilter}
            onChange={(e) => setCampFilter(e.target.value)}
            className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="all">{t("allCamps")}</option>
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
                {showCamps && (
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("camps")}
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
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    {campFilter === "all"
                      ? t("noContributions")
                      : t("noContributionsForCamp")}
                  </td>
                </tr>
              ) : (
                visible.map((c) => (
                  <tr
                    key={c.id}
                    className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                  >
                    {showProvider && (
                      <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {c.providerName ?? "—"}
                      </td>
                    )}
                    {showCamps && (
                      <td className="px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {c.camps?.length
                          ? c.camps.map((camp) => camp.name).join("، ")
                          : "—"}
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
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/contributions/${c.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t("contributionDetails")}
                        </Link>
                        {c.cancellable && (
                          <button
                            type="button"
                            onClick={() => cancelContribution(c.id)}
                            disabled={cancelling === c.id}
                            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                          >
                            {cancelling === c.id ? t("cancel") + "…" : t("cancelContribution")}
                          </button>
                        )}
                      </div>
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
