"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Camp = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  operationalStatus: string;
  needLevel: string;
  status: string;
};

export default function CampsList({
  initialCamps,
  isAdmin,
}: {
  initialCamps: Camp[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [camps, setCamps] = useState<Camp[]>(initialCamps);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDeactivate(id: string) {
    if (!confirm(language === "ar" ? "هل أنت متأكد من تعطيل/إغلاق هذا المخيم؟" : "Are you sure you want to close this camp?")) {
      return;
    }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/camps/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t("success"));
        // Update local state
        setCamps((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, status: "inactive", operationalStatus: "closed" }
              : c,
          ),
        );
        router.refresh();
      } else {
        toast.error(t("error"));
      }
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setLoadingId(null);
    }
  }

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
      return { label: t("inactive"), class: "bg-gray-2 text-dark-4 dark:bg-dark-2 dark:text-dark-6" };
    }
    return { label: t("active"), class: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" };
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {t("campsList")}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {language === "ar"
              ? "عرض وإدارة المخيمات وتعيين المدراء"
              : "View and manage IDP camps and assign managers"}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/camps/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
          >
            <span className="text-lg leading-none">+</span>
            {t("addCamp")}
          </Link>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm text-right">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("campName")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("campLocation")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("campCapacity")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("campNeedLevel")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("campOperationalStatus")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {camps.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    {language === "ar" ? "لا يوجد مخيمات بعد" : "No camps registered yet"}
                  </td>
                </tr>
              ) : (
                camps.map((item) => {
                  const needDetails = getNeedLevelDetails(item.needLevel);
                  const statusDetails = getStatusDetails(item.operationalStatus, item.status);
                  const isClosed = item.status === "inactive" || item.operationalStatus === "closed";

                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                    >
                      {/* Name */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Link
                          href={`/dashboard/camps/${item.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>

                      {/* Location */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {t(item.location)}
                      </td>

                      {/* Capacity */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {item.capacity}
                      </td>

                      {/* Need Level */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${needDetails.class}`}
                        >
                          {needDetails.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusDetails.class}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isClosed ? "bg-red-500" : "bg-green-500"
                            }`}
                          />
                          {statusDetails.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/camps/${item.id}`}
                            className="text-xs font-medium text-dark-4 hover:text-primary dark:text-dark-6"
                          >
                            {language === "ar" ? "عرض التفاصيل" : "View"}
                          </Link>
                          {isAdmin && !isClosed && (
                            <>
                              <Link
                                href={`/dashboard/camps/${item.id}/edit`}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {t("edit")}
                              </Link>
                              <button
                                onClick={() => handleDeactivate(item.id)}
                                disabled={loadingId === item.id}
                                className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
                              >
                                {loadingId === item.id ? "..." : t("deactivate")}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
