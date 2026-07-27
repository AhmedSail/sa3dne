"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";

export default function BeneficiaryDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="rounded-xl border border-stroke bg-white p-8 text-center shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <h1 className="mb-4 text-3xl font-black text-dark dark:text-white">
          {isAr ? "مرحباً بك في منصة ساعدني" : "Welcome to Sa3dne Platform"}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-dark-4 dark:text-dark-6">
          {isAr
            ? "هذه لوحة التحكم الخاصة بك. يمكنك من خلالها تقديم الشكاوى وتتبعها، بالإضافة إلى إدارة وعرض بيانات عائلتك وموقعك في المخيم."
            : "This is your personal dashboard. You can submit and track complaints, as well as manage and view your family information and camp location."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Track Complaints */}
        <Link
          href="/dashboard/my-complaints"
          className="group block rounded-xl border border-stroke bg-white p-6 shadow-default transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg dark:border-dark-3 dark:bg-gray-dark dark:hover:border-primary"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">
            {isAr ? "تتبع شكوى" : "Track Complaint"}
          </h3>
          <p className="text-sm font-medium text-dark-4 dark:text-dark-6">
            {isAr
              ? "تابع حالة الشكاوى والمقترحات التي قمت بتقديمها سابقاً."
              : "Track the status of your previously submitted complaints."}
          </p>
        </Link>

        {/* Submit Complaint */}
        <Link
          href="/dashboard/my-complaints/new"
          className="group block rounded-xl border border-stroke bg-white p-6 shadow-default transition-all hover:-translate-y-1 hover:border-orange-500 hover:shadow-lg dark:border-dark-3 dark:bg-gray-dark dark:hover:border-orange-500"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">
            {isAr ? "تقديم شكوى جديدة" : "Submit Complaint"}
          </h3>
          <p className="text-sm font-medium text-dark-4 dark:text-dark-6">
            {isAr
              ? "قدم شكوى أو مقترح جديد لإدارة المخيم ليتم مراجعته."
              : "Submit a new complaint or suggestion for camp management to review."}
          </p>
        </Link>

        {/* My Family */}
        <Link
          href="/dashboard/my-family"
          className="group block rounded-xl border border-stroke bg-white p-6 shadow-default transition-all hover:-translate-y-1 hover:border-green-500 hover:shadow-lg dark:border-dark-3 dark:bg-gray-dark dark:hover:border-green-500"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">
            {isAr ? "معلومات عائلتي" : "My Family Info"}
          </h3>
          <p className="text-sm font-medium text-dark-4 dark:text-dark-6">
            {isAr
              ? "عرض تفاصيل عائلتك وتحديث معلوماتكم وموقعكم في المخيم."
              : "View your family details and update your info and camp location."}
          </p>
        </Link>
      </div>
    </div>
  );
}
