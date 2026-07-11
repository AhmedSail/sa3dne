"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ProviderDetailsProps = {
  provider: {
    id: string;
    type: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    status: string;
    linkedUserName: string | null;
    linkedUserEmail: string | null;
  };
};

export default function ProviderDetails({ provider }: ProviderDetailsProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"info" | "contributions" | "camps">("info");

  // Mock contribution logs to simulate registry for Tab 2
  const mockContributions = [
    {
      id: "1",
      date: "2026-07-02",
      type: language === "ar" ? "سلة غذائية متكاملة" : "Food Basket",
      quantity: "150 سلة",
      campName: language === "ar" ? "مخيم الشاطئ النموذجي" : "Al-Shati Beach Camp",
      status: language === "ar" ? "مستلم" : "Received",
    },
    {
      id: "2",
      date: "2026-07-08",
      type: language === "ar" ? "توزيع مياه صالحة للشرب" : "Drinking Water",
      quantity: "5000 لتر",
      campName: language === "ar" ? "مخيم دير البلح الغربي" : "West Deir al-Balah Camp",
      status: language === "ar" ? "مستلم" : "Received",
    }
  ];

  // Mock camps coverage logs for Tab 3
  const mockCampsCoverage = [
    {
      id: "c1",
      name: language === "ar" ? "مخيم الشاطئ النموذجي" : "Al-Shati Beach Camp",
      location: language === "ar" ? "مدينة غزة" : "Gaza City",
      totalAidBatches: 3,
      status: language === "ar" ? "نشط" : "Active",
    },
    {
      id: "c2",
      name: language === "ar" ? "مخيم دير البلح الغربي" : "West Deir al-Balah Camp",
      location: language === "ar" ? "دير البلح / الوسطى" : "Middle Area",
      totalAidBatches: 2,
      status: language === "ar" ? "نشط" : "Active",
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {language === "ar" ? "تفاصيل جهة المساعدات" : "Aid Provider Details"}
          </h1>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            {provider.name} | {t("providerType")}: <span className="font-semibold text-primary">{t(provider.type === "organization" ? "providerTypeOrg" : "providerTypeIndie")}</span>
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/providers"
            className="inline-flex items-center justify-center rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:bg-dark-2"
          >
            &larr; {language === "ar" ? "العودة للقائمة" : "Back to list"}
          </Link>
        </div>
      </div>

      {/* Tabs Control Switcher */}
      <div className="border-b border-stroke dark:border-dark-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            {t("stepBasicInfo")}
          </button>

          <button
            onClick={() => setActiveTab("contributions")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "contributions"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            {t("contributionHistory")} ({mockContributions.length})
          </button>

          <button
            onClick={() => setActiveTab("camps")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "camps"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z" />
            </svg>
            {language === "ar" ? "تغطية المخيمات" : "Camps Coverage"}
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        {activeTab === "info" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-dark dark:text-white border-b border-stroke pb-3 dark:border-dark-3">
              {language === "ar" ? "البيانات التفصيلية للمزود" : "Detailed Provider Information"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("providerName")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{provider.name}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("providerType")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">
                  {t(provider.type === "organization" ? "providerTypeOrg" : "providerTypeIndie")}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("contactPerson")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{provider.contactPerson || "—"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("phone")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{provider.phone || "—"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">Email</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{provider.email || "—"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("status")}</span>
                <span className={cn(
                  "inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase mt-1",
                  provider.status === "active" ? "bg-green-500/10 text-green-500" : "bg-red/10 text-red"
                )}>
                  {t(provider.status)}
                </span>
              </div>

              {provider.linkedUserName && (
                <div className="space-y-1 md:col-span-2 bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <span className="text-xs font-semibold text-primary block">{t("linkedUser")}</span>
                  <span className="text-sm font-bold text-dark dark:text-white block">
                    {provider.linkedUserName} ({provider.linkedUserEmail})
                  </span>
                </div>
              )}
            </div>

            {provider.notes && (
              <div className="bg-gray-2 p-4 rounded-lg dark:bg-dark-2 space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("notes")}</span>
                <p className="text-sm text-dark dark:text-white">{provider.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "contributions" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-dark dark:text-white border-b border-stroke pb-3 dark:border-dark-3">
              {language === "ar" ? "سجل المعونات والمساعدات المقدمة" : "Aid Contribution History"}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse dir-custom">
                <thead>
                  <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                    <th className="pb-3 text-start">{language === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="pb-3 text-start">{t("aidTypeName")}</th>
                    <th className="pb-3 text-start">{t("camps")}</th>
                    <th className="pb-3 text-center">{language === "ar" ? "الكمية" : "Quantity"}</th>
                    <th className="pb-3 text-end">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
                  {mockContributions.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                      <td className="py-3 text-start text-xs font-mono">{log.date}</td>
                      <td className="py-3 text-start font-medium">{log.type}</td>
                      <td className="py-3 text-start text-xs">{log.campName}</td>
                      <td className="py-3 text-center font-bold text-primary">{log.quantity}</td>
                      <td className="py-3 text-end">
                        <span className="inline-block rounded bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-500">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "camps" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-dark dark:text-white border-b border-stroke pb-3 dark:border-dark-3">
              {language === "ar" ? "المخيمات التي يغطيها هذا المزود" : "Camps Coverage Area"}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse dir-custom">
                <thead>
                  <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                    <th className="pb-3 text-start">{t("campName")}</th>
                    <th className="pb-3 text-start">{t("campLocation")}</th>
                    <th className="pb-3 text-center">{language === "ar" ? "عدد الدفعات المستلمة" : "Aid Batches Delivered"}</th>
                    <th className="pb-3 text-end">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
                  {mockCampsCoverage.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                      <td className="py-3 text-start font-semibold">{c.name}</td>
                      <td className="py-3 text-start text-xs text-dark-5 dark:text-dark-6">{c.location}</td>
                      <td className="py-3 text-center font-bold text-primary">{c.totalAidBatches}</td>
                      <td className="py-3 text-end">
                        <span className="inline-block rounded bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-500">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
