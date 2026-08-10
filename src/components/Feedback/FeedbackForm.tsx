"use client";

import { useState } from "react";
import { submitComplaint } from "@/lib/actions/complaints";
import { toast } from "sonner";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";

type Camp = { id: string; name: string };
type ContactSettings = {
  whatsapp?: string | null;
  email?: string | null;
  phone?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  address?: string | null;
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm font-medium text-dark outline-none backdrop-blur-sm transition-all duration-200 placeholder:text-gray-300 focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#10b981]";

/*
 * Selects reuse the input styling but need an opaque background: browsers paint
 * the native dropdown from the control's own colour, and a translucent one
 * leaves the popup washed out.
 */
const selectClass = `${inputClass} bg-white dark:bg-dark-2`;

export default function FeedbackForm({ camps, settings }: { camps: Camp[], settings?: ContactSettings }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
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
      toast.error(t(res.error));
    } else if (res.trackingNumber) {
      toast.success(t("feedbackSuccessToast"));
      setSuccessTrackingNumber(res.trackingNumber);
    }

    setLoading(false);
  }

  /* ── Success State ── */
  if (successTrackingNumber) {
    return (
      <div className="flex w-full flex-col items-center justify-center px-4 py-16" dir={isAr ? "rtl" : "ltr"}>
        <div className="w-full max-w-lg">
          <div className="relative overflow-hidden rounded-3xl border border-[#10b981]/20 bg-white p-10 shadow-[0_20px_60px_rgba(16,185,129,0.1)] dark:bg-[#0f1c2e]">
            {/* glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#10b981]/10 blur-3xl" />
            
            <div className="relative flex flex-col items-center text-center">
              {/* check icon */}
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#10b981]/10 ring-4 ring-[#10b981]/20">
                <svg className="h-10 w-10 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="mb-3 text-2xl font-black text-dark dark:text-white">
                {t("feedbackSuccessTitle")}
              </h2>
              <p className="mb-8 text-sm font-medium text-gray-400">
                {t("feedbackSuccessDesc")}
              </p>

              {/* Tracking number */}
              <div className="mb-8 w-full rounded-2xl border-2 border-dashed border-[#10b981]/30 bg-[#10b981]/5 p-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#10b981]">{t("feedbackTrackingNum")}</p>
                <p className="text-3xl font-black tracking-wider text-dark dark:text-white">
                  {successTrackingNumber}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Link
                  href="/track"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#10b981] px-6 py-3.5 text-sm font-black text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#059669]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  {t("feedbackTrackNowBtn")}
                </Link>
                <Link
                  href="/"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-black text-gray-500 transition-all hover:-translate-y-0.5 hover:border-[#10b981]/30 dark:border-white/10 dark:bg-transparent dark:text-gray-300"
                >
                  {t("feedbackBackHomeBtn")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="w-full px-4 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className={`mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr] ${!isAr ? "text-left" : ""}`}>

        {/* ── Left: Info Panel ── */}
        <div className="flex flex-col gap-8">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#10b981]/10 px-4 py-1.5 text-xs font-bold text-[#10b981]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981]" />
              {t("feedbackAvailableToAll")}
            </span>
            <h1 className="mt-4 text-3xl font-black text-dark dark:text-white sm:text-4xl">
              {t("feedbackSubmitTitle")}
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-gray-400">
              {t("feedbackSubmitDesc")}
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-5">
            {[
              { num: "01", title: t("feedbackStep1Title"), desc: t("feedbackStep1Desc") },
              { num: "02", title: t("feedbackStep2Title"), desc: t("feedbackStep2Desc") },
              { num: "03", title: t("feedbackStep3Title"), desc: t("feedbackStep3Desc") },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10 text-sm font-black text-[#10b981]">
                  {step.num}
                </div>
                <div>
                  <p className="font-black text-dark dark:text-white">{step.title}</p>
                  <p className="text-sm font-medium text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Track link */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/10 dark:bg-blue-500/5">
            <p className="mb-2 text-sm font-black text-dark dark:text-white">{t("feedbackHaveTracking")}</p>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 hover:underline"
            >
              {t("feedbackTrackFromHere")}
              <svg className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M3 12h18" />
              </svg>
            </Link>
          </div>

          {/* Contact Methods Panel */}
          {settings && (settings.whatsapp || settings.email || settings.facebook || settings.phone) && (
            <div className="rounded-2xl border border-[#10b981]/20 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0f1c2e]">
              <h3 className="mb-4 text-lg font-black text-dark dark:text-white">{t("feedbackContactUs")}</h3>
              <div className="flex flex-col gap-3">
                {settings.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-[#25D366]/10 p-3 text-[#25D366] transition hover:bg-[#25D366]/20">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#25D366]/80">{t("feedbackWhatsapp")}</span>
                      <span className="text-sm font-black" dir="ltr">{settings.whatsapp}</span>
                    </div>
                  </a>
                )}
                
                {settings.email && (
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-xl bg-blue-500/10 p-3 text-blue-500 transition hover:bg-blue-500/20">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-500/80">{t("feedbackEmail")}</span>
                      <span className="text-sm font-black text-left w-full block" dir="ltr">{settings.email}</span>
                    </div>
                  </a>
                )}

                {settings.phone && (
                  <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-3 rounded-xl bg-purple-500/10 p-3 text-purple-500 transition hover:bg-purple-500/20">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-purple-500/80">{t("feedbackPhoneNum")}</span>
                      <span className="text-sm font-black" dir="ltr">{settings.phone}</span>
                    </div>
                  </a>
                )}

                {/* Social Links Row */}
                <div className="mt-2 flex gap-3">
                  {settings.facebook && (
                    <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2] transition hover:bg-[#1877F2]/20">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {settings.twitter && (
                    <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-black dark:bg-white/10 dark:text-white transition hover:bg-gray-200 dark:hover:bg-white/20">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {settings.instagram && (
                    <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4405F]/10 text-[#E4405F] transition hover:bg-[#E4405F]/20">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                  {settings.linkedin && (
                    <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] transition hover:bg-[#0A66C2]/20">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Form Card ── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:border-white/5 dark:bg-[#0f1c2e]">
          {/* Glow blob */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#10b981]/8 blur-3xl" />

          <form onSubmit={handleSubmit} className="relative flex flex-col gap-5">
            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-black text-dark dark:text-white">
                {t("feedbackMessageType")} <span className="text-red-500">*</span>
              </label>
              <select name="type" required className={selectClass}>
                <option value="">{t("feedbackSelectType")}</option>
                <option value="complaint">{t("feedbackTypeComplaint")}</option>
                <option value="suggestion">{t("feedbackTypeSuggestion")}</option>
                <option value="unmet_need">{t("feedbackTypeUnmetNeed")}</option>
              </select>
            </div>

            {/* Camp */}
            <div>
              <label className="mb-2 block text-sm font-black text-dark dark:text-white">
                {t("feedbackRelatedCamp")} <span className="text-red-500">*</span>
              </label>
              <select name="campId" required className={selectClass}>
                <option value="">{t("feedbackSelectCamp")}</option>
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>{camp.name}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-black text-dark dark:text-white">
                {t("feedbackFullName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="beneficiaryName"
                required
                placeholder={t("feedbackEnterFullName")}
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-black text-dark dark:text-white">
                {t("feedbackPhoneNum")}{" "}
                <span className="text-xs font-medium text-gray-400">{t("feedbackOptional")}</span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder={t("feedbackEnterPhone")}
                className={inputClass}
              />
            </div>

            {/* Details */}
            <div>
              <label className="mb-2 block text-sm font-black text-dark dark:text-white">
                {t("feedbackDetails")} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="details"
                required
                rows={5}
                placeholder={t("feedbackWriteDetails")}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#10b981] px-6 py-4 text-sm font-black text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#059669] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("feedbackSending")}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {t("feedbackSubmitBtn")}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
