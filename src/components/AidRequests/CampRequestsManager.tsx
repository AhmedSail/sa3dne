"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type CampOption = { id: string; name: string };
type AidTypeOption = { id: string; name: string; defaultUnit: string };

type AidRequestRow = {
  id: string;
  campId: string;
  campName: string;
  aidTypeId: string;
  aidTypeName: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  unit: string;
  urgencyLevel: string;
  notes: string | null;
  status: string;
  createdAt: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const URGENCY_LABELS: Record<string, { ar: string; en: string }> = {
  low: { ar: "منخفض", en: "Low" },
  medium: { ar: "متوسط", en: "Medium" },
  high: { ar: "مرتفع", en: "High" },
  critical: { ar: "حرج", en: "Critical" },
};

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  open: { ar: "مفتوح", en: "Open", color: "bg-blue-100 text-blue-800" },
  in_progress: { ar: "قيد التنفيذ", en: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  fulfilled: { ar: "مكتمل", en: "Fulfilled", color: "bg-green-100 text-green-800" },
  cancelled: { ar: "ملغي", en: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function CampRequestsManager({
  assignedCamps,
  aidTypes,
}: {
  assignedCamps: CampOption[];
  aidTypes: AidTypeOption[];
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  
  const [requests, setRequests] = useState<AidRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    campId: assignedCamps.length === 1 ? assignedCamps[0].id : "",
    aidTypeId: "",
    requestedQuantity: "",
    unit: "",
    urgencyLevel: "medium",
    notes: "",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/aid-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAidTypeChange = (aidTypeId: string) => {
    const at = aidTypes.find((a) => a.id === aidTypeId);
    setForm((prev) => ({
      ...prev,
      aidTypeId,
      unit: at?.defaultUnit || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campId || !form.aidTypeId || !form.requestedQuantity) {
      toast.error(isAr ? "جميع الحقول المطلوبة يجب تعبئتها" : "Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/aid-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: form.campId,
          aidTypeId: form.aidTypeId,
          requestedQuantity: Number(form.requestedQuantity),
          unit: form.unit,
          urgencyLevel: form.urgencyLevel,
          notes: form.notes,
        }),
      });

      if (res.ok) {
        toast.success(isAr ? "تم إنشاء الطلب بنجاح" : "Request created successfully");
        setShowForm(false);
        setForm({
          ...form,
          aidTypeId: "",
          requestedQuantity: "",
          notes: "",
        });
        fetchRequests();
      } else {
        const err = await res.json();
        if (res.status === 409 || err.error.includes("already has an open")) {
          toast.error(isAr ? "هذا المخيم لديه طلب مساعدة مفتوح اليوم. يرجى الانتظار حتى يكتمل أو إلغاؤه قبل طلب جديد." : err.error);
        } else {
          toast.error(err.error || "Error");
        }
      }
    } catch (err) {
      toast.error("Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {isAr ? "طلبات المساعدة" : "Aid Requests"}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {isAr
              ? "إدارة طلبات واحتياجات المخيم"
              : "Manage camp needs and requests"}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
          >
            {isAr ? "طلب مساعدة جديدة" : "New Request"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-bold text-dark dark:text-white">
            {isAr ? "إنشاء طلب جديد" : "Create New Request"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "المخيم *" : "Camp *"}
                </label>
                <select
                  value={form.campId}
                  onChange={(e) => setForm({ ...form, campId: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                  disabled={assignedCamps.length === 1}
                >
                  <option value="">{isAr ? "اختر المخيم..." : "Select camp..."}</option>
                  {assignedCamps.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "نوع المساعدة *" : "Aid Type *"}
                </label>
                <select
                  value={form.aidTypeId}
                  onChange={(e) => handleAidTypeChange(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                >
                  <option value="">{isAr ? "اختر نوع المساعدة..." : "Select aid type..."}</option>
                  {aidTypes.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "الكمية المطلوبة *" : "Requested Quantity *"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.requestedQuantity}
                  onChange={(e) => setForm({ ...form, requestedQuantity: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "الوحدة *" : "Unit *"}
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {isAr ? "مستوى الأهمية *" : "Urgency Level *"}
                </label>
                <select
                  value={form.urgencyLevel}
                  onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                >
                  <option value="low">{isAr ? "منخفض" : "Low"}</option>
                  <option value="medium">{isAr ? "متوسط" : "Medium"}</option>
                  <option value="high">{isAr ? "مرتفع" : "High"}</option>
                  <option value="critical">{isAr ? "حرج" : "Critical"}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "ملاحظات إضافية" : "Additional Notes"}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-dark-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {submitting ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "إرسال الطلب" : "Submit Request")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm text-right">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "المخيم" : "Camp"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "نوع المساعدة" : "Aid Type"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "المطلوب" : "Requested"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "المتوفر (تم الالتزام به)" : "Committed"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "الأهمية" : "Urgency"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "الحالة" : "Status"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {isAr ? "تاريخ الطلب" : "Date"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-4">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6">
                    {isAr ? "لا توجد طلبات مساعدة" : "No aid requests found"}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-1 dark:hover:bg-dark-2">
                    <td className="whitespace-nowrap px-4 py-3 text-dark dark:text-white">
                      {r.campName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {r.aidTypeName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {r.requestedQuantity} {r.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary font-medium">
                      {r.fulfilledQuantity} {r.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-xs text-dark-4">
                        {isAr ? URGENCY_LABELS[r.urgencyLevel]?.ar : URGENCY_LABELS[r.urgencyLevel]?.en}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[r.status]?.color}`}>
                        {isAr ? STATUS_LABELS[r.status]?.ar : STATUS_LABELS[r.status]?.en}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {formatDate(r.createdAt)}
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
