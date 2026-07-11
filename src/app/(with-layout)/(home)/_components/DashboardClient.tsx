"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { GovernorateChart } from "./GovernorateChart";
import { NeedLevelChart } from "./NeedLevelChart";

type CampOccupancy = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  familiesCount: number;
  occupancyRate: number;
  needLevel: string;
};

type RecentFamily = {
  id: string;
  headName: string;
  nationalId: string;
  memberCount: number;
  campName: string;
  createdAt: string | Date;
};

type DashboardData = {
  totalCamps: number;
  totalFamilies: number;
  totalIndividuals: number;
  totalProviders: number;
  campOccupancy: CampOccupancy[];
  governorateStats: {
    north_gaza: number;
    gaza_city: number;
    middle_area: number;
    khan_yunis: number;
    rafah: number;
  };
  needLevelStats: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recentFamilies: RecentFamily[];
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { t, language } = useLanguage();

  const govData = [
    { name: t("gaza_city"), amount: data.governorateStats.gaza_city },
    { name: t("middle_area"), amount: data.governorateStats.middle_area },
    { name: t("khan_yunis"), amount: data.governorateStats.khan_yunis },
    { name: t("rafah"), amount: data.governorateStats.rafah },
    { name: t("north_gaza"), amount: data.governorateStats.north_gaza },
  ];

  const needData = [
    { name: t("needLevelLow"), amount: data.needLevelStats.low },
    { name: t("needLevelMedium"), amount: data.needLevelStats.medium },
    { name: t("needLevelHigh"), amount: data.needLevelStats.high },
    { name: t("needLevelCritical"), amount: data.needLevelStats.critical },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Overview Cards Group */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {/* Total Camps Card */}
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase">
              {t("camps")}
            </p>
            <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
              {data.totalCamps}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10zM12 10.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
            </svg>
          </div>
        </div>

        {/* Total Families Card */}
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase">
              {t("families")}
            </p>
            <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
              {data.totalFamilies}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        </div>

        {/* Total Individuals Card */}
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase">
              {language === "ar" ? "إجمالي الأفراد" : "Total Individuals"}
            </p>
            <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
              {data.totalIndividuals}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>

        {/* Total Providers Card */}
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase">
              {t("providers")}
            </p>
            <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
              {data.totalProviders}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Camps by Governorate Chart */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-base font-bold text-dark dark:text-white">
            {language === "ar" ? "توزيع المخيمات الجغرافي" : "Camps by Governorate"}
          </h3>
          <GovernorateChart data={govData} />
        </div>

        {/* Need Level Breakdown Chart */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-base font-bold text-dark dark:text-white">
            {language === "ar" ? "توزيع مستويات الاحتياج" : "Need Level Breakdown"}
          </h3>
          <NeedLevelChart data={needData} />
        </div>
      </div>

      {/* 3. Camps Occupancy & Need Levels */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {language === "ar" ? "نسب إشغال المخيمات والاحتياج" : "Camp Occupancy & Need Levels"}
          </h2>
          <Link
            href="/dashboard/camps"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {language === "ar" ? "عرض جميع المخيمات" : "View all camps"} &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dir-custom">
            <thead>
              <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                <th className="pb-3 text-start">{t("campName")}</th>
                <th className="pb-3 text-start">{t("campLocation")}</th>
                <th className="pb-3 text-center">{t("campNeedLevel")}</th>
                <th className="pb-3 text-center">{language === "ar" ? "العائلات المسجلة" : "Registered Families"}</th>
                <th className="pb-3 text-end" style={{ minWidth: "140px" }}>{language === "ar" ? "نسبة الإشغال" : "Occupancy Rate"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
              {data.campOccupancy.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-dark-5">
                    {language === "ar" ? "لا توجد مخيمات حالياً" : "No camps registered yet."}
                  </td>
                </tr>
              ) : (
                data.campOccupancy.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                    <td className="py-3.5 font-medium text-start">
                      <Link href={`/dashboard/camps/${c.id}`} className="hover:underline text-primary">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3.5 text-start text-xs text-dark-5 dark:text-dark-6 font-medium">
                      {t(c.location)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={cn(
                        "inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase",
                        c.needLevel === "critical" && "bg-red/10 text-red",
                        c.needLevel === "high" && "bg-orange-500/10 text-orange-500",
                        c.needLevel === "medium" && "bg-yellow-500/10 text-yellow-500",
                        c.needLevel === "low" && "bg-green-500/10 text-green-500"
                      )}>
                        {t(`needLevel${c.needLevel.charAt(0).toUpperCase() + c.needLevel.slice(1)}`)}
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-semibold">
                      {c.familiesCount} / {c.capacity}
                    </td>
                    <td className="py-3.5 text-end">
                      <div className="flex items-center justify-end gap-2.5">
                        <span className="text-xs font-semibold">{c.occupancyRate}%</span>
                        <div className="h-1.5 w-20 rounded-full bg-stroke dark:bg-dark-3 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              c.occupancyRate > 90 ? "bg-red" : c.occupancyRate > 70 ? "bg-orange-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(c.occupancyRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Registered Families */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {language === "ar" ? "آخر العائلات المسجلة" : "Recently Registered Families"}
          </h2>
          <Link
            href="/dashboard/families"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {language === "ar" ? "عرض جميع العائلات" : "View all families"} &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dir-custom">
            <thead>
              <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                <th className="pb-3 text-start">{t("headName")}</th>
                <th className="pb-3 text-start">{t("nationalId")}</th>
                <th className="pb-3 text-center">{t("memberCount")}</th>
                <th className="pb-3 text-start">{t("camps")}</th>
                <th className="pb-3 text-end">{language === "ar" ? "تاريخ التسجيل" : "Registration Date"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
              {data.recentFamilies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-dark-5">
                    {language === "ar" ? "لا توجد عائلات مسجلة حالياً" : "No families registered yet."}
                  </td>
                </tr>
              ) : (
                data.recentFamilies.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                    <td className="py-3 font-semibold text-start text-primary hover:underline">
                      <Link href={`/dashboard/families/${f.id}`}>{f.headName}</Link>
                    </td>
                    <td className="py-3 text-start text-xs text-dark-5 dark:text-dark-6 font-mono">
                      {f.nationalId}
                    </td>
                    <td className="py-3 text-center font-semibold">{f.memberCount}</td>
                    <td className="py-3 text-start text-xs text-dark-5 dark:text-dark-6">{f.campName}</td>
                    <td className="py-3 text-end text-xs text-dark-4 dark:text-dark-6">
                      {new Date(f.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
