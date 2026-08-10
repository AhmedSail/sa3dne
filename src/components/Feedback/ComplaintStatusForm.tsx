"use client";

import { useState } from "react";
import { updateComplaintStatus } from "@/lib/actions/complaints";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";

type ComplaintStatus = "pending" | "in_review" | "resolved" | "rejected";

interface ComplaintStatusFormProps {
  complaintId: string;
  initialStatus: ComplaintStatus;
  initialResolutionNotes?: string | null;
  initialRejectionReason?: string | null;
}

export default function ComplaintStatusForm({
  complaintId,
  initialStatus,
  initialResolutionNotes,
  initialRejectionReason,
}: ComplaintStatusFormProps) {
  const [status, setStatus] = useState<ComplaintStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, language } = useLanguage();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const resolutionNotes = formData.get("resolutionNotes") as string;
    const rejectionReason = formData.get("rejectionReason") as string;

    const res = await updateComplaintStatus(complaintId, {
      status,
      resolutionNotes: resolutionNotes || undefined,
      rejectionReason: rejectionReason || undefined,
    });

    if (res.error) {
      toast.error(t(res.error));
    } else {
      toast.success(t("statusUpdated" as any));
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-dark-3">
        <h3 className="font-semibold text-dark dark:text-white">{t("updateStatus" as any)}</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6.5">
        <div className="mb-4.5">
          <label className={`mb-2.5 block text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
            {t("status" as any)}
          </label>
          <div className="relative z-20 bg-transparent dark:bg-dark-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
              className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 ${language === "ar" ? "text-right" : "text-left"}`}
            >
              <option value="pending">{t("statusPending" as any)}</option>
              <option value="in_review">{t("statusInReview" as any)}</option>
              <option value="resolved">{t("statusResolved" as any)}</option>
              <option value="rejected">{t("statusRejected" as any)}</option>
            </select>
          </div>
        </div>

        {status === "resolved" && (
          <div className="mb-4.5">
            <label className={`mb-2.5 block text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
              {t("resolutionNotes" as any)} <span className="text-red">*</span>
            </label>
            <textarea
              name="resolutionNotes"
              rows={4}
              required
              defaultValue={initialResolutionNotes || ""}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2"
            ></textarea>
          </div>
        )}

        {status === "rejected" && (
          <div className="mb-4.5">
            <label className={`mb-2.5 block text-dark dark:text-white ${language === "ar" ? "text-right" : "text-left"}`}>
              {t("rejectionReason" as any)} <span className="text-red">*</span>
            </label>
            <textarea
              name="rejectionReason"
              rows={4}
              required
              defaultValue={initialRejectionReason || ""}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2"
            ></textarea>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? t("saving" as any) : t("saveChanges" as any)}
        </button>
      </form>
    </div>
  );
}
