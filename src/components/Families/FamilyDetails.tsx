"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type FamilyMember = {
  id: string;
  nationalId?: string | null;
  name: string;
  relationship: string;
  educationLevel: string;
  gender: string;
  birthDate: Date | string | null;
  createdAt: Date;
};

type FamilyDetailsProps = {
  family: {
    id: string;
    campId: string;
    headName: string;
    nationalId: string;
    phone: string | null;
    memberCount: number;
    occupation: string | null;
    notes: string | null;
    status: string;
    inactiveReason: string | null;
    campName: string;
    campLocation: string;
    members: FamilyMember[];
  };
};

export default function FamilyDetails({ family }: FamilyDetailsProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"info" | "members" | "history">("info");

  const calculateAge = (birthDateStr: Date | string | null) => {
    if (!birthDateStr) return "—";
    try {
      const today = new Date();
      const birth = new Date(birthDateStr);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? `${age} ${language === "ar" ? "سنة" : "years"}` : "—";
    } catch (e) {
      return "—";
    }
  };

  // Mock aid history logs to simulate contribution registry for Tab 3
  const mockAidHistory = [
    {
      id: "1",
      date: "2026-07-02",
      type: language === "ar" ? "سلة غذائية متكاملة" : "Food Basket",
      provider: language === "ar" ? "جمعية الهلال الأحمر الفلسطيني" : "PRCS",
      quantity: "1 سلة",
      status: language === "ar" ? "تم التسليم" : "Delivered",
    },
    {
      id: "2",
      date: "2026-07-08",
      type: language === "ar" ? "توزيع مياه صالحة للشرب" : "Drinking Water",
      provider: language === "ar" ? "مبادرة أهل غزة لخير غزة" : "Gaza Initiative",
      quantity: "50 لتر",
      status: language === "ar" ? "تم التسليم" : "Delivered",
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {language === "ar" ? "تفاصيل العائلة" : "Family Details"}
          </h1>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            {family.headName} | {t("nationalId")}: <span className="font-mono">{family.nationalId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/families/${family.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-opacity-90"
          >
            {t("edit")}
          </Link>
          <Link
            href="/dashboard/families"
            className="inline-flex items-center justify-center rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:bg-dark-2"
          >
            &larr; {language === "ar" ? "العودة للقائمة" : "Back to registry"}
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
            onClick={() => setActiveTab("members")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {t("stepFamilyMembers")} ({family.members.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            {language === "ar" ? "سجل توزيع المساعدات" : "Aid Contribution History"}
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        {activeTab === "info" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-dark dark:text-white border-b border-stroke pb-3 dark:border-dark-3">
              {language === "ar" ? "البيانات الأساسية لرب الأسرة" : "Basic Family Information"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("headName")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{family.headName}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("nationalId")}</span>
                <span className="text-sm font-bold text-dark dark:text-white font-mono block">{family.nationalId}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("phone")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{family.phone || "—"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("occupation")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{family.occupation || "—"}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("camps")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{family.campName}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("campLocation")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{t(family.campLocation)}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("memberCount")}</span>
                <span className="text-sm font-bold text-dark dark:text-white block">{family.memberCount}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("status")}</span>
                <span className={cn(
                  "inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase mt-1",
                  family.status === "active" ? "bg-green-500/10 text-green-500" : "bg-red/10 text-red"
                )}>
                  {t(family.status)}
                </span>
              </div>
            </div>

            {family.inactiveReason && (
              <div className="bg-red/5 p-4 rounded-lg border border-red/10 space-y-1">
                <span className="text-xs font-semibold text-red block">{t("inactiveReason")}</span>
                <span className="text-sm text-red font-medium block">{family.inactiveReason}</span>
              </div>
            )}

            {family.notes && (
              <div className="bg-gray-2 p-4 rounded-lg dark:bg-dark-2 space-y-1">
                <span className="text-xs font-semibold text-dark-5 dark:text-dark-6 block">{t("notes")}</span>
                <p className="text-sm text-dark dark:text-white">{family.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-dark-3">
              <h3 className="text-base font-bold text-dark dark:text-white">
                {language === "ar" ? "قائمة أفراد العائلة المسجلين" : "Registered Family Members"}
              </h3>
              <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2.5 py-1">
                {language === "ar" ? `إجمالي الأفراد المضافين: ${family.members.length}` : `Total Members: ${family.members.length}`}
              </span>
            </div>

            {family.members.length === 0 ? (
              <p className="text-center text-sm text-dark-5 dark:text-dark-6 py-8">
                {language === "ar" ? "لا يوجد أفراد مسجلين لهذه العائلة بعد (فقط رب الأسرة)." : "No family members registered yet (only family head)."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse dir-custom">
                  <thead>
                    <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                      <th className="pb-3 text-start">#</th>
                      <th className="pb-3 text-start">{t("memberNationalId")}</th>
                      <th className="pb-3 text-start">{t("memberName")}</th>
                      <th className="pb-3 text-start">{t("relationship")}</th>
                      <th className="pb-3 text-start">{t("educationLevel")}</th>
                      <th className="pb-3 text-start">{t("gender")}</th>
                      <th className="pb-3 text-start">{t("birthDate")}</th>
                      <th className="pb-3 text-start">{language === "ar" ? "العمر" : "Age"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
                    {family.members.map((m, i) => (
                      <tr key={m.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                        <td className="py-3 text-start font-mono text-xs">{i + 1}</td>
                        <td className="py-3 text-start text-xs font-mono">{m.nationalId || "—"}</td>
                        <td className="py-3 text-start font-semibold">{m.name}</td>
                        <td className="py-3 text-start">{t(m.relationship)}</td>
                        <td className="py-3 text-start text-xs">{t(m.educationLevel)}</td>
                        <td className="py-3 text-start text-xs">{t(m.gender || "male")}</td>
                        <td className="py-3 text-start text-xs font-mono">
                          {m.birthDate
                            ? new Date(m.birthDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 text-start text-xs font-semibold text-primary">
                          {calculateAge(m.birthDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-dark dark:text-white border-b border-stroke pb-3 dark:border-dark-3">
              {language === "ar" ? "سجل استلام المعونات والمساعدات" : "Aid Distribution Logs"}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse dir-custom">
                <thead>
                  <tr className="border-b border-stroke text-xs font-semibold text-dark-4 dark:border-dark-3 dark:text-dark-6">
                    <th className="pb-3 text-start">{language === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="pb-3 text-start">{t("aidTypeName")}</th>
                    <th className="pb-3 text-start">{t("providerName")}</th>
                    <th className="pb-3 text-center">{language === "ar" ? "الكمية" : "Quantity"}</th>
                    <th className="pb-3 text-end">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke text-sm text-dark dark:divide-dark-3 dark:text-white">
                  {mockAidHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-2/50 dark:hover:bg-dark-2/50">
                      <td className="py-3 text-start text-xs font-mono">{log.date}</td>
                      <td className="py-3 text-start font-medium">{log.type}</td>
                      <td className="py-3 text-start text-xs">{log.provider}</td>
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
      </div>
    </div>
  );
}
