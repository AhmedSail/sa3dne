"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

type LanguageContextType = {
  language: Language;
  dir: "rtl" | "ltr";
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    // Load from localStorage if present
    const saved = localStorage.getItem("lang") as Language;
    if (saved === "ar" || saved === "en") {
      setLanguageState(saved);
    } else {
      // Default to Arabic for Middle East focus, or browser language
      const isEn = navigator.language.startsWith("en");
      setLanguageState(isEn ? "en" : "ar");
    }
  }, []);

  const dir = language === "ar" ? "rtl" : "ltr";

  // Effect to synchronize html direction
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    localStorage.setItem("lang", language);
  }, [language, dir]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey | string): string => {
    const dict = translations[language];
    // Fallback to English dictionary if key is missing in selected language
    const val = (dict as any)[key] ?? (translations.en as any)[key] ?? key;
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, dir, toggleLanguage, setLanguage, t }}>
      <div dir={dir} className="w-full min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
