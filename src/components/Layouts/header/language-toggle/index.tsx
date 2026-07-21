"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="dark:border-stroke-dark dark:bg-dark-2 dark:hover:bg-dark-3 flex h-[38px] w-[38px] min-w-[38px] min-h-[38px] shrink-0 items-center justify-center rounded-full border border-stroke bg-gray-2 text-xs font-bold text-dark hover:bg-gray-3 whitespace-nowrap dark:text-white"
      title={language === "ar" ? "English" : "العربية"}
    >
      {language === "ar" ? "EN" : "عربي"}
    </button>
  );
}
