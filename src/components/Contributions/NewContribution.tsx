"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewContribution({
  providerName,
}: {
  providerName: string;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });
      if (res.ok) {
        const created = await res.json();
        toast.success(t("success"));
        router.push(`/dashboard/contributions/${created.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || t("error"));
        setLoading(false);
      }
    } catch {
      toast.error(t("error"));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("newContribution")}
        </h1>
        <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
          {language === "ar"
            ? "أنشئ مسودة ثم أضف بنود المساعدة لكل مخيم قبل الإرسال"
            : "Create a draft, then add per-camp aid lines before submitting"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
            {t("provider")}
          </label>
          <input
            type="text"
            value={providerName}
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-stroke bg-gray-1 px-4 py-2.5 text-sm text-dark-4 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
            {t("notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={
              language === "ar" ? "ملاحظات اختيارية" : "Optional notes"
            }
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {loading ? t("loading") : t("createDraft")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/contributions")}
            className="rounded-lg border border-stroke px-5 py-2 text-sm font-semibold text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
