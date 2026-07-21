"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import Image from "next/image";

export default function PublicFooter() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <footer 
      dir={isAr ? "rtl" : "ltr"}
      className="mt-auto border-t border-gray-100 bg-white py-8 dark:border-white/5 dark:bg-gray-dark"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        
        {/* Top Section */}
        <div className="flex flex-col items-center justify-between gap-6 border-b border-gray-100 pb-8 sm:flex-row dark:border-white/5">
          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-400">
            <Link href="#" className="transition-colors hover:text-[#10b981]">
              {t("mockupTerms")}
            </Link>
            <Link href="#" className="transition-colors hover:text-[#10b981]">
              {t("mockupPrivacy")}
            </Link>
            <Link href="/feedback" className="transition-colors hover:text-[#10b981]">
              {t("landingContactLink")}
            </Link>
          </div>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/images/logo/logo.png"
              alt="Sa3dne"
              width={180}
              height={180}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <svg className="h-4 w-4 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            {t("mockupGradProject")}
          </div>
          
          <p className="text-xs font-medium text-gray-400">
            {t("mockupCopyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
