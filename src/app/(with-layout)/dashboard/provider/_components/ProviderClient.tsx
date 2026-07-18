"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AidContribution } from "@/db/schema";

type ProviderData = {
  hasProvider: boolean;
  providerId?: string;
  providerName?: string;
  contributions: AidContribution[];
  totalDraft: number;
  totalSubmitted: number;
  totalCancelled: number;
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

export default function ProviderClient({ data }: { data: ProviderData }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  if (!data.hasProvider) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-dark-4 dark:text-dark-6">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {isAr ? "حسابك غير مرتبط بجهة مانحة" : "Account Not Linked"}
        </h2>
        <p className="text-dark-5">
          {isAr 
            ? "لم يتم ربط حسابك بأي جهة مانحة أو مبادرة مستقلة بعد. يرجى التواصل مع الإدارة." 
            : "Your account is not linked to any aid provider or independent initiative. Please contact administration."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {isAr ? `مرحباً، ${data.providerName}` : `Welcome, ${data.providerName}`}
          </h1>
          <p className="text-sm text-dark-5">
            {isAr ? "إحصائيات مساهماتك الإنسانية" : "Your humanitarian contributions statistics"}
          </p>
        </div>
        <Link
          href="/dashboard/my-contributions/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-opacity-90"
        >
          {t("newContribution")}
        </Link>
      </div>

      {/* 1. Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("contributions")}
          value={data.contributions.length}
          color="bg-primary/10 text-primary"
          href="/dashboard/my-contributions"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
          }
        />
        <StatCard
          label={t("contributionStatusDraft")}
          value={data.totalDraft}
          color="bg-warning/10 text-warning"
          href="/dashboard/my-contributions?status=draft"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          }
        />
        <StatCard
          label={t("contributionStatusSubmitted")}
          value={data.totalSubmitted}
          color="bg-success/10 text-success"
          href="/dashboard/my-contributions?status=submitted"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          }
        />
        <StatCard
          label={t("contributionStatusCancelled")}
          value={data.totalCancelled}
          color="bg-danger/10 text-danger"
          href="/dashboard/my-contributions?status=cancelled"
          icon={
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
            </svg>
          }
        />
      </div>

      {/* 2. Recent Contributions List */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            {isAr ? "أحدث مساهماتي" : "My Recent Contributions"}
          </h2>
          <Link href="/dashboard/my-contributions" className="text-xs font-semibold text-primary hover:underline">
            {isAr ? "عرض جميع المساهمات" : "View all contributions"} &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                <th className="pb-3 text-start">ID</th>
                <th className="pb-3 text-center">{t("status")}</th>
                <th className="pb-3 text-end">{isAr ? "تاريخ الإنشاء" : "Created At"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
              {data.contributions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-dark-5">
                    {t("noContributions")}
                  </td>
                </tr>
              ) : (
                data.contributions.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                    <td className="py-3 font-semibold text-start text-primary hover:underline font-mono">
                      <Link href={`/dashboard/my-contributions/${c.id}`}>{c.id.split("-")[0]}</Link>
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        "inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase",
                        c.status === "draft" && "bg-warning/10 text-warning",
                        c.status === "submitted" && "bg-success/10 text-success",
                        c.status === "cancelled" && "bg-danger/10 text-danger"
                      )}>
                        {t(`contributionStatus${c.status.charAt(0).toUpperCase() + c.status.slice(1)}` as any)}
                      </span>
                    </td>
                    <td className="py-3 text-end text-xs text-dark-4 dark:text-dark-6">
                      {new Date(c.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                        year: "numeric", month: "short", day: "numeric",
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
