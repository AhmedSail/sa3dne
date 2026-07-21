import { type PropsWithChildren } from "react";
import { ThemeToggleSwitch } from "@/components/Layouts/header/theme-toggle";
import { LanguageToggle } from "@/components/Layouts/header/language-toggle";

export default function WithoutLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-dark relative">
      <div className="fixed top-4 start-4 sm:top-6 sm:start-6 z-50 flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggleSwitch />
      </div>
      {children}
    </div>
  );
}
