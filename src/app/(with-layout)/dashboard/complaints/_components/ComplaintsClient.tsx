"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import dayjs from "dayjs";
import { useLanguage } from "@/lib/i18n/language-context";
import ExportButtons from "@/components/ExportButtons";

interface ComplaintsClientProps {
  complaints: any[];
  error: string | null;
  searchParams: { keyword?: string; type?: string; status?: string };
}

export default function ComplaintsClient({
  complaints,
  error,
  searchParams,
}: ComplaintsClientProps) {
  const { t, language } = useLanguage();
  const { keyword, type, status } = searchParams;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">
            {t("statusPending" as any)}
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {t("statusInReview" as any)}
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
            {t("statusResolved" as any)}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger">
            {t("statusRejected" as any)}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (tType: string) => {
    switch (tType) {
      case "complaint":
        return t("typeComplaint" as any);
      case "suggestion":
        return t("typeSuggestion" as any);
      case "unmet_need":
        return t("typeUnmetNeed" as any);
      default:
        return tType;
    }
  };

  return (
    <>
      <Breadcrumb pageName={t("complaints")} />

      {error ? (
        <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark text-danger">
          {error}
        </div>
      ) : (
        <div className="rounded-[10px] border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:px-7.5 xl:pb-1">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex justify-end print:hidden">
              <ExportButtons 
                data={complaints}
                filename={t("complaintsExportFilename")}
                columns={[
                  { key: "trackingNumber", label: t("trackingNumber") },
                  { key: "beneficiaryName", label: t("applicant") },
                  { key: "type", label: t("type") },
                  { key: "createdAt", label: t("submissionDate") },
                  { key: "status", label: t("status") }
                ]}
              />
            </div>
            <form className="flex flex-col sm:flex-row gap-4 print:hidden">
              <input
                type="text"
                name="keyword"
                defaultValue={keyword}
                placeholder={t("searchTrackingOrName" as any)}
                className="w-full sm:w-1/3 rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2"
              />
              <select
                name="type"
                defaultValue={type || ""}
                className={`w-full sm:w-1/4 rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 ${language === "ar" ? "text-right" : "text-left"}`}
              >
                <option value="">{t("allTypes" as any)}</option>
                <option value="complaint">{t("typeComplaint" as any)}</option>
                <option value="suggestion">{t("typeSuggestion" as any)}</option>
                <option value="unmet_need">{t("typeUnmetNeed" as any)}</option>
              </select>
              <select
                name="status"
                defaultValue={status || ""}
                className={`w-full sm:w-1/4 rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 ${language === "ar" ? "text-right" : "text-left"}`}
              >
                <option value="">{t("allStatuses" as any)}</option>
                <option value="pending">{t("statusPending" as any)}</option>
                <option value="in_review">{t("statusInReview" as any)}</option>
                <option value="resolved">{t("statusResolved" as any)}</option>
                <option value="rejected">{t("statusRejected" as any)}</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
              >
                {t("search" as any)}
              </button>
            </form>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-dark-2">
                  <th className={`min-w-[150px] py-4 px-4 font-medium text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
                    {t("trackingNumber" as any)}
                  </th>
                  <th className={`min-w-[150px] py-4 px-4 font-medium text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
                    {t("applicant" as any)}
                  </th>
                  <th className={`min-w-[120px] py-4 px-4 font-medium text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
                    {t("type" as any)}
                  </th>
                  <th className={`min-w-[120px] py-4 px-4 font-medium text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
                    {t("submissionDate" as any)}
                  </th>
                  <th className={`min-w-[120px] py-4 px-4 font-medium text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
                    {t("status" as any) || "Status"}
                  </th>
                  <th className="py-4 px-4 font-medium text-dark dark:text-white text-center">
                    {t("actions" as any) || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-dark-4 dark:text-dark-6"
                    >
                      {t("noComplaints" as any)}
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id}>
                      <td
                        className={`border-b border-[#eee] py-5 px-4 dark:border-dark-3 font-medium ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {c.trackingNumber}
                      </td>
                      <td
                        className={`border-b border-[#eee] py-5 px-4 dark:border-dark-3 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        <p className="text-dark dark:text-white">
                          {c.beneficiaryName}
                        </p>
                        {c.phone && (
                          <p className="text-sm text-dark-4">{c.phone}</p>
                        )}
                      </td>
                      <td
                        className={`border-b border-[#eee] py-5 px-4 dark:border-dark-3 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {getTypeLabel(c.type)}
                      </td>
                      <td
                        className={`border-b border-[#eee] py-5 px-4 dark:border-dark-3 ${language === "ar" ? "text-right" : "text-left"}`}
                        dir="ltr"
                      >
                        {dayjs(c.createdAt)
                          .locale(language === "ar" ? "ar" : "en")
                          .format("YYYY-MM-DD")}
                      </td>
                      <td
                        className={`border-b border-[#eee] py-5 px-4 dark:border-dark-3 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-dark-3 text-center">
                        <Link
                          href={`/dashboard/complaints/${c.id}`}
                          className="text-primary hover:underline"
                        >
                          {t("view" as any)}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
