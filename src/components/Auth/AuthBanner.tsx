"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Image from "next/image";
import Link from "next/link";

export function AuthBanner({ type }: { type: "signin" | "signup" }) {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl px-12 pt-12 pb-0"
      style={{
        background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 -left-10 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <Link className="mb-8 inline-block transition-transform hover:scale-105" href="/">
          <Image
            src="/images/logo/logo.png"
            alt="Sa3dne Logo"
            width={220}
            height={220}
            quality={100}
            className="object-contain drop-shadow-lg"
          />
        </Link>

        <p className="mb-2 text-base font-bold text-white/80">
          {type === "signin" ? t("authSignInTitle") : t("authSignUpTitle")}
        </p>

        <h1 className="mb-4 text-3xl font-black text-white drop-shadow-sm sm:text-4xl">
          {type === "signin" ? t("authSignInSubtitle") : t("authSignUpSubtitle")}
        </h1>

        <p className="w-full max-w-[375px] leading-relaxed font-medium text-white/75">
          {type === "signin" ? t("authSignInDesc") : t("authSignUpDesc")}
        </p>
      </div>

      {/* Bottom grid illustration */}
      <div className="relative mt-12">
        <Image
          src="/images/grids/grid-02.svg"
          alt="Grid"
          width={405}
          height={325}
          className="mx-auto opacity-20"
        />
      </div>
    </div>
  );
}
