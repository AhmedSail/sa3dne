"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CampStat = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  needLevel: string;
  operationalStatus: string;
  familiesCount: number;
  complaintsCount: number;
  pendingComplaints: number;
};

type CampManagerData = {
  campIds: string[];
  camps: CampStat[];
  totalFamilies: number;
  totalIndividuals: number;
  pendingComplaints: number;
  totalComplaints: number;
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

export default function CampManagerClient({ data }: { data: CampManagerData }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  if (data.camps.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-dark-4 dark:text-dark-6">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {isAr ? "لا توجد مخيمات معينة" : "No Assigned Camps"}
        </h2>
        <p className="text-dark-5">
          {isAr 
            ? "لم يتم تعيين أي مخيم لك لإدارته بعد. يرجى التواصل مع مسؤول النظام." 
            : "You have not been assigned to manage any camps yet. Please contact the system administrator."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isAr ? "مخيماتي" : "My Camps"}
          value={data.camps.length}
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
      </div>

      {/* 2. My Camps Details */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {isAr ? "تفاصيل مخيماتي" : "My Camps Details"}
          </h2>
          <Link href="/dashboard/camps" className="text-xs font-semibold text-primary hover:underline">
            {isAr ? "إدارة المخيمات" : "Manage Camps"} &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                <th className="pb-3 text-start">{t("campName")}</th>
                <th className="pb-3 text-start">{t("campLocation")}</th>
                <th className="pb-3 text-center">{t("campNeedLevel")}</th>
                <th className="pb-3 text-center">{isAr ? "العائلات" : "Families"}</th>
                <th className="pb-3 text-center">{isAr ? "الشكاوى" : "Complaints"}</th>
                <th className="pb-3 text-end" style={{ minWidth: "140px" }}>{isAr ? "نسبة الإشغال" : "Occupancy Rate"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
              {data.camps.map((c) => {
                const occupancyRate = c.capacity > 0 ? Math.round((c.familiesCount / c.capacity) * 100) : 0;
                return (
                  <tr key={c.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                    <td className="py-3.5 font-medium text-start">
                      <Link href={`/dashboard/camps/${c.id}`} className="hover:underline text-primary">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3.5 text-start text-xs text-dark-5 dark:text-dark-6 font-medium">
                      {t(c.location as any)}
                    </td>
                    <td className="py-3.5 text-center">
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
                    <td className="py-3.5 text-center font-semibold">
                      {c.familiesCount} / {c.capacity}
                    </td>
                    <td className="py-3.5 text-center font-semibold">
                      <span className={c.pendingComplaints > 0 ? "text-orange-500" : ""}>
                        {c.pendingComplaints} {isAr ? "معلقة" : "pending"}
                      </span>
                      <span className="text-dark-5 dark:text-dark-6 text-xs mx-1">/</span>
                      {c.complaintsCount} {isAr ? "إجمالي" : "total"}
                    </td>
                    <td className="py-3.5 text-end">
                      <div className="flex items-center justify-end gap-2.5">
                        <span className="text-xs font-semibold">{occupancyRate}%</span>
                        <div className="h-1.5 w-20 rounded-full bg-stroke dark:bg-dark-3 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              occupancyRate > 90 ? "bg-red" : occupancyRate > 70 ? "bg-orange-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
