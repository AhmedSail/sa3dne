"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useLanguage } from "@/lib/i18n/language-context";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 md:px-5 2xl:px-10 dark:border-stroke-dark dark:bg-gray-dark print:hidden">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 lg:hidden dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A]"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      <div className="max-xl:hidden">
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          {t("dashboard")}
        </h1>
        <p className="text-xs font-medium text-dark-5 dark:text-dark-6">
          Sa3dne Camp Management
        </p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 2xsm:gap-4">

        <button
          onClick={toggleLanguage}
          className="flex h-10 min-h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-stroke bg-gray-2 text-xs font-bold whitespace-nowrap text-dark hover:bg-gray-3 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          title={language === "ar" ? "English" : "العربية"}
        >
          {language === "ar" ? "EN" : "عربي"}
        </button>

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
