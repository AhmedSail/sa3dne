"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { submitComplaint } from "@/lib/actions/complaints";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Complaint = {
  id: string;
  trackingNumber: string;
  type: string;
  details: string;
  status: string;
  resolutionNotes: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  campName: string | null;
};

type Camp = { id: string; name: string; location: string | null };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  in_review: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function MyComplaintsClient({
  myComplaints,
  camps,
  defaultCampId,
  defaultName,
}: {
  myComplaints: Complaint[];
  camps: Camp[];
  defaultCampId: string;
  defaultName: string;
}) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    campId: defaultCampId,
    type: "complaint" as "complaint" | "suggestion" | "unmet_need",
    beneficiaryName: defaultName,
    phone: "",
    details: "",
  });
  const [successTracking, setSuccessTracking] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitComplaint(form);
      if (result.error) throw new Error(t(result.error));
      setSuccessTracking(result.trackingNumber!);
      setShowForm(false);
      toast.success(isAr ? "تم تقديم الشكوى بنجاح" : "Complaint submitted successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel: Record<string, string> = {
    pending: isAr ? "قيد الانتظار" : "Pending",
    in_review: isAr ? "قيد المراجعة" : "Under Review",
    resolved: isAr ? "تم الحل" : "Resolved",
    rejected: isAr ? "مرفوض" : "Rejected",
  };

  const typeLabel: Record<string, string> = {
    complaint: isAr ? "شكوى" : "Complaint",
    suggestion: isAr ? "مقترح" : "Suggestion",
    unmet_need: isAr ? "احتياج غير ملبى" : "Unmet Need",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark dark:text-white">
            {isAr ? "شكاواي ومقترحاتي" : "My Complaints & Suggestions"}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {isAr ? `${myComplaints.length} شكوى / مقترح مسجل` : `${myComplaints.length} registered complaint(s)`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary/90"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          {isAr ? "تقديم شكوى جديدة" : "New Complaint"}
        </button>
      </div>

      {/* Success tracking number */}
      {successTracking && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="font-bold text-green-700 dark:text-green-400">
            {isAr ? "✅ تم تقديم الشكوى! رقم التتبع الخاص بك:" : "✅ Complaint submitted! Your tracking number:"}
          </p>
          <p className="mt-1 font-mono text-lg font-black text-green-800 dark:text-green-300">
            {successTracking}
          </p>
          <p className="mt-1 text-sm text-green-600 dark:text-green-500">
            {isAr ? "احتفظ بهذا الرقم لمتابعة حالة الشكوى." : "Keep this number to track your complaint status."}
          </p>
        </div>
      )}

      {/* New Complaint Form */}
      {showForm && (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-5 text-lg font-bold text-dark dark:text-white">
            {isAr ? "تقديم شكوى / مقترح جديد" : "Submit New Complaint / Suggestion"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "الاسم *" : "Name *"}
                </label>
                <input
                  name="beneficiaryName"
                  required
                  value={form.beneficiaryName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "رقم الهاتف" : "Phone"}
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "النوع *" : "Type *"}
                </label>
                <select
                  name="type"
                  required
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-dark-2 dark:text-white"
                >
                  <option value="complaint">{isAr ? "شكوى" : "Complaint"}</option>
                  <option value="suggestion">{isAr ? "مقترح" : "Suggestion"}</option>
                  <option value="unmet_need">{isAr ? "احتياج غير ملبى" : "Unmet Need"}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "المخيم *" : "Camp *"}
                </label>
                <select
                  name="campId"
                  required
                  value={form.campId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-dark-2 dark:text-white"
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "التفاصيل *" : "Details *"}
                </label>
                <textarea
                  name="details"
                  rows={4}
                  required
                  minLength={10}
                  value={form.details}
                  onChange={handleChange}
                  placeholder={isAr ? "اشرح شكواك أو مقترحك بالتفصيل..." : "Describe your complaint or suggestion in detail..."}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-medium text-dark transition-all hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? isAr ? "جاري الإرسال..." : "Submitting..." : isAr ? "إرسال الشكوى" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark">
        {myComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-gray-300 dark:text-dark-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <p className="text-lg font-bold text-dark-4 dark:text-dark-6">
              {isAr ? "لا توجد شكاوى مسجلة بعد" : "No complaints registered yet"}
            </p>
            <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
              {isAr ? "اضغط على 'تقديم شكوى جديدة' لإضافة أول شكوى" : "Click 'New Complaint' to add your first one"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stroke dark:divide-dark-3">
            {myComplaints.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-primary">{c.trackingNumber}</span>
                      <span className="text-xs font-semibold text-dark-4 dark:text-dark-6">
                        — {typeLabel[c.type] ?? c.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-dark dark:text-white line-clamp-2">{c.details}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold shrink-0", STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600")}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                </div>
                {c.resolutionNotes && (
                  <div className="mt-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                      {isAr ? "ملاحظات الحل:" : "Resolution Notes:"}
                    </p>
                    <p className="mt-0.5 text-sm text-green-800 dark:text-green-300">{c.resolutionNotes}</p>
                  </div>
                )}
                {c.rejectionReason && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      {isAr ? "سبب الرفض:" : "Rejection Reason:"}
                    </p>
                    <p className="mt-0.5 text-sm text-red-800 dark:text-red-300">{c.rejectionReason}</p>
                  </div>
                )}
                <p className="mt-3 text-xs text-dark-4 dark:text-dark-6">
                  {new Date(c.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
