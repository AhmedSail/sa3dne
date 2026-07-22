"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { CustomThemeProvider } from "@/lib/theme/theme-context";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress harmless AbortError unhandled rejections caused by React StrictMode unmounting
    // and cancelling fetch requests (like useSession).
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === "AbortError" || event.reason?.message?.includes("aborted")) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}
