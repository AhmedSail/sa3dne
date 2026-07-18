"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ComplaintStatusForm from "@/components/Feedback/ComplaintStatusForm";
import dayjs from "dayjs";
import { useLanguage } from "@/lib/i18n/language-context";

interface ComplaintDetailsClientProps {
  data: {
    complaint: any;
    campName: string;
  };
}

export default function ComplaintDetailsClient({ data }: ComplaintDetailsClientProps) {
  const { t, language } = useLanguage();

  const getTypeLabel = (tType: string) => {
    switch (tType) {
      case "complaint": return t("typeComplaint" as any);
      case "suggestion": return t("typeSuggestion" as any);
      case "unmet_need": return t("typeUnmetNeed" as any);
      default: return tType;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "pending": return <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">{t("statusPending" as any)}</span>;
      case "in_review": return <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{t("statusInReview" as any)}</span>;
      case "resolved": return <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">{t("statusResolved" as any)}</span>;
      case "rejected": return <span className="inline-flex rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger">{t("statusRejected" as any)}</span>;
      default: return null;
    }
  };

  return (
    <>
      <Breadcrumb pageName={`${t("complaintRequest" as any)}${data.complaint.trackingNumber}`} />

      <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
        <div className="flex flex-col gap-9">
          <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-dark-3 flex justify-between items-center">
              <h3 className="font-semibold text-dark dark:text-white">{t("complaintInfo" as any)}</h3>
              {getStatusBadge(data.complaint.status)}
            </div>
            <div className="p-6.5 flex flex-col gap-4">
              <div className="flex justify-between border-b border-stroke pb-4 dark:border-dark-3">
                <span className="text-dark-4 dark:text-dark-6">{t("type" as any)}</span>
                <span className="font-medium text-dark dark:text-white">{getTypeLabel(data.complaint.type)}</span>
              </div>
              <div className="flex justify-between border-b border-stroke pb-4 dark:border-dark-3">
                <span className="text-dark-4 dark:text-dark-6">{t("submissionDate" as any)}</span>
                <span className="font-medium text-dark dark:text-white" dir="ltr">
                  {dayjs(data.complaint.createdAt).locale(language === "ar" ? "ar" : "en").format("YYYY-MM-DD HH:mm")}
                </span>
              </div>
              <div className="flex justify-between border-b border-stroke pb-4 dark:border-dark-3">
                <span className="text-dark-4 dark:text-dark-6">{t("assignedCampName" as any)}</span>
                <span className="font-medium text-dark dark:text-white">{data.campName}</span>
              </div>
              <div className="flex justify-between border-b border-stroke pb-4 dark:border-dark-3">
                <span className="text-dark-4 dark:text-dark-6">{t("applicant" as any)}</span>
                <span className="font-medium text-dark dark:text-white">{data.complaint.beneficiaryName}</span>
              </div>
              <div className="flex justify-between border-b border-stroke pb-4 dark:border-dark-3">
                <span className="text-dark-4 dark:text-dark-6">{t("phone" as any)}</span>
                <span className="font-medium text-dark dark:text-white" dir="ltr">{data.complaint.phone || "-"}</span>
              </div>
              <div className={`pt-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                <span className="block mb-2 text-dark-4 dark:text-dark-6">{t("details" as any)}:</span>
                <p className={`p-4 bg-gray-2 dark:bg-dark-2 rounded-lg text-dark dark:text-white leading-relaxed ${language === "ar" ? "text-right" : "text-left"}`}>
                  {data.complaint.details}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-9">
          <ComplaintStatusForm
            complaintId={data.complaint.id}
            initialStatus={data.complaint.status as any}
            initialResolutionNotes={data.complaint.resolutionNotes}
            initialRejectionReason={data.complaint.rejectionReason}
          />
        </div>
      </div>
    </>
  );
}
