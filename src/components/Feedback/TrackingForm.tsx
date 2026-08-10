"use client";

import { useState } from "react";
import { trackComplaint } from "@/lib/actions/complaints";
import { useLanguage } from "@/lib/i18n/language-context";
import { toast } from "sonner";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/ar";

export default function TrackingForm() {
  const { t, language } = useLanguage();
  // Keep the date formatting in step with the selected interface language.
  dayjs.locale(language);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const trackingNumber = formData.get("trackingNumber") as string;

    const res = await trackComplaint({ trackingNumber });
    
    if (res.error) {
      toast.error(t(res.error));
    } else if (res.complaint) {
      setResult(res.complaint);
    }

    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">{t("statusPending")}</span>;
      case "in_review":
        return <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{t("statusInReview")}</span>;
      case "resolved":
        return <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">{t("statusResolved")}</span>;
      case "rejected":
        return <span className="inline-flex rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger">{t("statusRejected")}</span>;
      default:
        return <span className="inline-flex rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">{t("statusUnknown")}</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "complaint": return t("typeComplaint");
      case "suggestion": return t("typeSuggestion");
      case "unmet_need": return t("typeUnmetNeed");
      default: return type;
    }
  };

  return (
    <div className="w-full max-w-[570px] mx-auto p-4 sm:p-12.5 xl:p-15 bg-white dark:bg-dark-2 rounded-2xl shadow-1">
      <h2 className="mb-9 text-2xl font-bold text-dark dark:text-white sm:text-title-xl2 text-center">
        {t("trackRequestTitle")}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-5">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">{t("trackingNumber")}</label>
          <input
            type="text"
            name="trackingNumber"
            required
            placeholder={t("trackingNumberPlaceholder")}
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-3 text-white transition hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? t("searching") : t("trackButton")}
        </button>
      </form>

      {result && (
        <div className="border-t border-stroke pt-6 dark:border-dark-3">
          <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">{t("requestDetails")}</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-stroke dark:border-dark-3">
              <span className="text-dark-4 dark:text-dark-6">{t("requestType")}</span>
              <span className="font-medium text-dark dark:text-white">{getTypeLabel(result.type)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-stroke dark:border-dark-3">
              <span className="text-dark-4 dark:text-dark-6">{t("submissionDate")}</span>
              <span className="font-medium text-dark dark:text-white" dir="ltr">
                {dayjs(result.createdAt).format("YYYY-MM-DD HH:mm")}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-stroke dark:border-dark-3">
              <span className="text-dark-4 dark:text-dark-6">{t("currentStatus")}</span>
              {getStatusBadge(result.status)}
            </div>

            {result.status === "resolved" && result.resolutionNotes && (
              <div className="pt-2">
                <span className="block mb-2 text-dark-4 dark:text-dark-6">{t("resolutionNotes")}</span>
                <p className="p-4 bg-success/5 border border-success/20 rounded-lg text-dark dark:text-white">
                  {result.resolutionNotes}
                </p>
              </div>
            )}

            {result.status === "rejected" && result.rejectionReason && (
              <div className="pt-2">
                <span className="block mb-2 text-dark-4 dark:text-dark-6">{t("rejectionReason")}</span>
                <p className="p-4 bg-danger/5 border border-danger/20 rounded-lg text-dark dark:text-white">
                  {result.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-dark-4 dark:text-dark-6">
          {t("wantToSubmitNewRequest")} {" "}
          <Link href="/feedback" className="text-primary hover:underline">
            {t("clickHere")}
          </Link>
        </p>
      </div>
    </div>
  );
}
