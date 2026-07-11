"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { CustomThemeProvider } from "@/lib/theme/theme-context";
import { LanguageProvider } from "@/lib/i18n/language-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}
