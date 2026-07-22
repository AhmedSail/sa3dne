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
  operationalStatus: string;
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
  totalComplaints: number;
  pendingComplaints: number;
  totalContributions: number;
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
  complaintsByStatus: {
    pending: number;
    in_review: number;
    resolved: number;
    rejected: number;
  };
  recentFamilies: RecentFamily[];
};

function StatCard({
  label,
  value,
  color,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark flex items-center justify-between transition-transform hover:-translate-y-0.5",
        href && "cursor-pointer"
      )}
    >
      <div>
        <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase tracking-wide">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-dark dark:text-white">{value}</p>
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", color)}>
        {icon}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

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

  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      {/* 1. Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("camps")}
          value={data.totalCamps}
          color="bg-primary/10 text-primary"
          href="/dashboard/camps"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10zM12 10.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
            </svg>
          }
        />
        <StatCard
          label={t("families")}
          value={data.totalFamilies}
          color="bg-green-500/10 text-green-500"
          href="/dashboard/families"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          }
        />
        <StatCard
          label={isAr ? "إجمالي الأفراد" : "Total Individuals"}
          value={data.totalIndividuals}
          color="bg-cyan-500/10 text-cyan-500"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          }
        />
        <StatCard
          label={t("providers")}
          value={data.totalProviders}
          color="bg-amber-500/10 text-amber-500"
          href="/dashboard/providers"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z" />
            </svg>
          }
        />
      </div>

      {/* 2. Second Row — Complaints & Contributions */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("complaints")}
          value={data.totalComplaints}
          color="bg-purple-500/10 text-purple-500"
          href="/dashboard/complaints"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
            </svg>
          }
        />
        <StatCard
          label={isAr ? "شكاوى معلقة" : "Pending Complaints"}
          value={data.pendingComplaints}
          color="bg-orange-500/10 text-orange-500"
          href="/dashboard/complaints?status=pending"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          }
        />
        <StatCard
          label={t("contributions")}
          value={data.totalContributions}
          color="bg-teal-500/10 text-teal-500"
          href="/dashboard/contributions"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
          }
        />
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-base font-bold text-dark dark:text-white">
            {isAr ? "توزيع المخيمات الجغرافي" : "Camps by Governorate"}
          </h3>
          <GovernorateChart data={govData} />
        </div>

        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-base font-bold text-dark dark:text-white">
            {isAr ? "توزيع مستويات الاحتياج" : "Need Level Breakdown"}
          </h3>
          <NeedLevelChart data={needData} />
        </div>
      </div>

      {/* 4. Complaints Status Breakdown */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {isAr ? "حالة الشكاوى والمقترحات" : "Complaints Status Breakdown"}
          </h2>
          <Link href="/dashboard/complaints" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0">
            {isAr ? "عرض جميع الشكاوى" : "View all complaints"} &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: isAr ? "قيد الانتظار" : "Pending",
              value: data.complaintsByStatus.pending,
              color: "text-warning bg-warning/10",
              dot: "bg-warning",
            },
            {
              label: isAr ? "قيد المراجعة" : "In Review",
              value: data.complaintsByStatus.in_review,
              color: "text-primary bg-primary/10",
              dot: "bg-primary",
            },
            {
              label: isAr ? "تم الحل" : "Resolved",
              value: data.complaintsByStatus.resolved,
              color: "text-success bg-success/10",
              dot: "bg-success",
            },
            {
              label: isAr ? "مرفوض" : "Rejected",
              value: data.complaintsByStatus.rejected,
              color: "text-danger bg-danger/10",
              dot: "bg-danger",
            },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-lg p-4 text-center", item.color)}>
              <div className="text-3xl font-bold">{item.value}</div>
              <div className="mt-1 text-xs font-semibold">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Camps Occupancy & Need Levels */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {isAr ? "نسب إشغال المخيمات والاحتياج" : "Camp Occupancy & Need Levels"}
          </h2>
          <Link href="/dashboard/camps" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0">
            {isAr ? "عرض جميع المخيمات" : "View all camps"} &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                <th className="pb-3 px-4 text-start">{t("campName")}</th>
                <th className="pb-3 px-4 text-start">{t("campLocation")}</th>
                <th className="pb-3 px-4 text-center">{t("campNeedLevel")}</th>
                <th className="pb-3 px-4 text-center">{isAr ? "العائلات المسجلة" : "Registered Families"}</th>
                <th className="pb-3 px-4 text-end" style={{ minWidth: "140px" }}>{isAr ? "نسبة الإشغال" : "Occupancy Rate"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
              {data.campOccupancy.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-dark-5">
                    {isAr ? "لا توجد مخيمات حالياً" : "No camps registered yet."}
                  </td>
                </tr>
              ) : (
                data.campOccupancy.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                    <td className="py-3.5 px-4 font-medium text-start">
                      <Link href={`/dashboard/camps/${c.id}`} className="hover:underline text-primary">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-start text-xs text-dark-5 dark:text-dark-6 font-medium">
                      {t(c.location as any)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={cn(
                        "inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase",
                        c.needLevel === "critical" && "bg-red/10 text-red",
                        c.needLevel === "high" && "bg-orange-500/10 text-orange-500",
                        c.needLevel === "medium" && "bg-yellow-500/10 text-yellow-500",
                        c.needLevel === "low" && "bg-green-500/10 text-green-500"
                      )}>
                        {t(`needLevel${c.needLevel.charAt(0).toUpperCase() + c.needLevel.slice(1)}` as any)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {c.familiesCount} / {c.capacity}
                    </td>
                    <td className="py-3.5 px-4 text-end">
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

      {/* 6. Recent Registered Families */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {isAr ? "آخر العائلات المسجلة" : "Recently Registered Families"}
          </h2>
          <Link href="/dashboard/families" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0">
            {isAr ? "عرض جميع العائلات" : "View all families"} &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                <th className="pb-3 px-4 text-start">{t("headName")}</th>
                <th className="pb-3 px-4 text-start">{t("nationalId")}</th>
                <th className="pb-3 px-4 text-center">{t("memberCount")}</th>
                <th className="pb-3 px-4 text-start">{t("camps")}</th>
                <th className="pb-3 px-4 text-end">{isAr ? "تاريخ التسجيل" : "Registration Date"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
              {data.recentFamilies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-dark-5">
                    {isAr ? "لا توجد عائلات مسجلة حالياً" : "No families registered yet."}
                  </td>
                </tr>
              ) : (
                data.recentFamilies.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                    <td className="py-3 px-4 font-semibold text-start text-primary hover:underline">
                      <Link href={`/dashboard/families/${f.id}`}>{f.headName}</Link>
                    </td>
                    <td className="py-3 px-4 text-start text-xs text-dark-5 dark:text-dark-6 font-mono">
                      {f.nationalId}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{f.memberCount}</td>
                    <td className="py-3 px-4 text-start text-xs text-dark-5 dark:text-dark-6">{f.campName}</td>
                    <td className="py-3 px-4 text-end text-xs text-dark-4 dark:text-dark-6">
                      {new Date(f.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
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
