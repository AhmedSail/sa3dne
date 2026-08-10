"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";

type Manager = {
  id: string;
  name: string;
  email: string;
};

type CampDetailsData = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  operationalStatus: string;
  needLevel: string;
  notes: string | null;
  status: string;
  assignedManagers: Manager[];
};

export default function CampDetails({ camp }: { camp: CampDetailsData }) {
  const { t } = useLanguage();

  const getNeedLevelDetails = (level: string) => {
    switch (level) {
      case "low":
        return { label: t("needLevelLow"), class: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" };
      case "medium":
        return { label: t("needLevelMedium"), class: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" };
      case "high":
        return { label: t("needLevelHigh"), class: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" };
      case "critical":
        return { label: t("needLevelCritical"), class: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" };
      default:
        return { label: level, class: "bg-gray-2 text-dark-4 dark:bg-dark-2" };
    }
  };

  const getStatusDetails = (opStatus: string, status: string) => {
    if (status === "inactive" || opStatus === "closed") {
      return { label: t("closed"), class: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" };
    }
    if (opStatus === "inactive") {
      return { label: t("inactive"), class: "bg-gray-2 text-dark-4 dark:bg-dark-2" };
    }
    return { label: t("active"), class: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" };
  };

  const needDetails = getNeedLevelDetails(camp.needLevel);
  const statusDetails = getStatusDetails(camp.operationalStatus, camp.status);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {camp.name}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {t("campDetailsSubtitle")}
          </p>
        </div>
        <Link
          href="/dashboard/camps"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
        >
          {t("backToList")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Info Card */}
        <div className="col-span-2 rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark space-y-4">
          <h2 className="text-lg font-bold text-dark border-b border-stroke pb-2 dark:text-white dark:border-dark-3">
            {t("campInformation")}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("campLocation")}
              </p>
              <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                {t(camp.location)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("campCapacity")}
              </p>
              <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                {camp.capacity}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("campNeedLevel")}
              </p>
              <p className="mt-1">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${needDetails.class}`}>
                  {needDetails.label}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("campOperationalStatus")}
              </p>
              <p className="mt-1">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusDetails.class}`}>
                  {statusDetails.label}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-dark-4 dark:text-dark-6">
              {t("notes")}
            </p>
            <p className="mt-1 text-sm text-dark-4 dark:text-dark-6 whitespace-pre-line">
              {camp.notes || "—"}
            </p>
          </div>
        </div>

        {/* Assigned Managers Card */}
        <div className="col-span-1 rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark space-y-4">
          <h2 className="text-lg font-bold text-dark border-b border-stroke pb-2 dark:text-white dark:border-dark-3">
            {t("assignedManagers")}
          </h2>

          <div className="space-y-3">
            {camp.assignedManagers.length === 0 ? (
              <p className="text-sm text-dark-4 dark:text-dark-6">
                {t("noAssignedManagers")}
              </p>
            ) : (
              camp.assignedManagers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-stroke p-3 dark:border-dark-3 dark:bg-dark-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-dark dark:text-white truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-dark-4 dark:text-dark-6 truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
