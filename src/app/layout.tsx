import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | ساعدني - Sa3dne",
    default: "ساعدني - Sa3dne | منصة إدارة مخيمات النازحين",
  },
  description: "نظام متكامل لإدارة المخيمات وتتبع المساعدات الإنسانية وضمان الشفافية والمساءلة. ساعدني يوفر بيئة تقنية متطورة لخدمة النازحين وتلبية احتياجاتهم.",
  keywords: ["مخيمات النازحين", "إدارة المخيمات", "المساعدات الإنسانية", "فلسطين", "غزة", "ساعدني", "Sa3dne", "إدارة المساعدات", "شكاوى", "مقترحات"],
  authors: [{ name: "Sa3dne Team" }],
  openGraph: {
    title: "ساعدني - Sa3dne | منصة إدارة المخيمات",
    description: "نظام متكامل لإدارة المخيمات وتتبع المساعدات الإنسانية وضمان الشفافية.",
    url: "https://sa3dne.com",
    siteName: "ساعدني - Sa3dne",
    locale: "ar_PS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ساعدني - Sa3dne",
    description: "نظام متكامل لإدارة المخيمات وتتبع المساعدات الإنسانية وضمان الشفافية.",
  },
  icons: {
    icon: "/icon.png",
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          {children}

          <Toaster
            position="bottom-right"
            richColors
            closeButton
            duration={5000}
            toastOptions={{
              className: "dark:bg-gray-dark dark:border-dark-3 dark:text-white",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
