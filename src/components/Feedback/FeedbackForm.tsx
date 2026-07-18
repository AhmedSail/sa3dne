"use client";

import { useState } from "react";
import { submitComplaint } from "@/lib/actions/complaints";
import { toast } from "sonner";
import Link from "next/link";

type Camp = { id: string; name: string };

export default function FeedbackForm({ camps }: { camps: Camp[] }) {
  const [loading, setLoading] = useState(false);
  const [successTrackingNumber, setSuccessTrackingNumber] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      campId: formData.get("campId") as string,
      type: formData.get("type") as "complaint" | "suggestion" | "unmet_need",
      beneficiaryName: formData.get("beneficiaryName") as string,
      phone: formData.get("phone") as string,
      details: formData.get("details") as string,
    };

    const res = await submitComplaint(data);
    
    if (res.error) {
      toast.error(res.error);
    } else if (res.trackingNumber) {
      toast.success("تم الإرسال بنجاح");
      setSuccessTrackingNumber(res.trackingNumber);
    }

    setLoading(false);
  }

  if (successTrackingNumber) {
    return (
      <div className="w-full max-w-[570px] mx-auto p-4 sm:p-12.5 xl:p-15 bg-white dark:bg-dark-2 rounded-2xl shadow-1">
        <div className="text-center">
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">تم استلام طلبك بنجاح</h2>
          <p className="mb-4 text-dark-4 dark:text-dark-6">
            يرجى الاحتفاظ برقم التتبع التالي لمراجعة حالة طلبك لاحقاً:
          </p>
          <div className="mb-6 inline-block bg-gray-2 dark:bg-dark-3 px-6 py-3 rounded-lg text-xl font-bold text-primary">
            {successTrackingNumber}
          </div>
          <div>
            <Link href="/track" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90">
              تتبع الطلب الآن
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[570px] mx-auto p-4 sm:p-12.5 xl:p-15 bg-white dark:bg-dark-2 rounded-2xl shadow-1">
      <h2 className="mb-9 text-2xl font-bold text-dark dark:text-white sm:text-title-xl2 text-center">
        تقديم شكوى أو مقترح
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">نوع الرسالة</label>
          <select
            name="type"
            required
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
          >
            <option value="">اختر النوع...</option>
            <option value="complaint">شكوى</option>
            <option value="suggestion">مقترح</option>
            <option value="unmet_need">احتياج غير ملبى</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">المخيم التابع له</label>
          <select
            name="campId"
            required
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
          >
            <option value="">اختر المخيم...</option>
            {camps.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">الاسم بالكامل</label>
          <input
            type="text"
            name="beneficiaryName"
            required
            placeholder="أدخل اسمك الكامل"
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
          />
        </div>

        <div className="mb-5">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">رقم الهاتف (اختياري)</label>
          <input
            type="tel"
            name="phone"
            placeholder="أدخل رقم هاتفك"
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">التفاصيل</label>
          <textarea
            name="details"
            required
            rows={4}
            placeholder="اكتب تفاصيل الشكوى أو المقترح هنا..."
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-3 text-white transition hover:bg-opacity-90 disabled:opacity-50"
        >
          {loading ? "جاري الإرسال..." : "إرسال"}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-dark-4 dark:text-dark-6">
          لديك رقم تتبع؟ {" "}
          <Link href="/track" className="text-primary hover:underline">
            تتبع طلبك من هنا
          </Link>
        </p>
      </div>
    </div>
  );
}
