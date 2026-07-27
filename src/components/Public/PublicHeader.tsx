"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "@/components/Layouts/header/language-toggle";
import { ThemeToggleSwitch } from "@/components/Layouts/header/theme-toggle";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { UserInfo } from "@/components/Layouts/header/user-info";

export default function PublicHeader() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const pathname = usePathname();
  const session = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  /* ── Mount entrance animation ── */
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  /* ── Scroll shadow effect ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("landingHomeLink") },
    { href: "/#features", label: t("landingFeaturesLink") },
    { href: "/#how-it-works", label: t("landingHowItWorksLink") },
    { href: "/feedback", label: t("landingContactLink") },
  ];

  return (
    <>
      <style>{`
        @keyframes headerSlide {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes navItemFade {
          from { transform: translateY(-12px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes logoPop {
          0%   { transform: scale(0.7) rotate(-5deg); opacity: 0; }
          70%  { transform: scale(1.05) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);    opacity: 1; }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 0 8px 0 rgba(16,185,129,0.4); }
          50%       { box-shadow: 0 0 22px 4px rgba(16,185,129,0.6); }
        }
        .header-enter { animation: headerSlide 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .logo-pop     { animation: logoPop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
        .nav-item-1   { animation: navItemFade 0.5s ease 0.35s both; }
        .nav-item-2   { animation: navItemFade 0.5s ease 0.45s both; }
        .nav-item-3   { animation: navItemFade 0.5s ease 0.55s both; }
        .nav-item-4   { animation: navItemFade 0.5s ease 0.65s both; }
        .actions-fade { animation: navItemFade 0.5s ease 0.7s both; }
        .btn-glow     { animation: btnGlow 2.5s ease-in-out infinite; }
        .nav-link-line::after {
          content: '';
          display: block;
          height: 2px;
          width: 0;
          border-radius: 9999px;
          background: #10b981;
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1);
          margin-top: 2px;
        }
        .nav-link-line:hover::after { width: 100%; }
        .nav-link-line.active::after { width: 100%; }
      `}</style>

      <header
        ref={headerRef}
        dir={isAr ? "rtl" : "ltr"}
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          mounted ? "header-enter" : "opacity-0"
        } ${
          scrolled
            ? "border-b border-gray-100/80 bg-white/95 shadow-[0_4px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/5 dark:bg-gray-dark/95 dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
            : "border-b border-transparent bg-white/80 backdrop-blur-md dark:bg-gray-dark/80"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-4 sm:px-6">

          {/* ── Logo ── */}
          <Link href="/" className="logo-pop flex shrink-0 items-center gap-3 transition-transform duration-300 hover:scale-105">
            <Image
              src="/images/logo/logo.png"
              alt="Sa3dne"
              width={220}
              height={220}
              priority
              className="object-contain drop-shadow-sm"
            />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden items-center gap-8 text-sm font-bold md:flex">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link-line nav-item-${i + 1} relative pb-0.5 transition-colors duration-200 hover:text-[#10b981] ${
                    isActive ? "active text-[#10b981]" : "text-gray-400"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Actions ── */}
          <div className="actions-fade flex items-center gap-4">
            <div className="hidden items-center gap-2 border-e border-gray-200 pe-4 sm:flex dark:border-white/10">
              <LanguageToggle />
              <ThemeToggleSwitch />
            </div>

            <div className="flex items-center gap-3">
              {!session.data ? (
                <Link
                  href="/auth/sign-in"
                  className="hidden items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#10b981]/30 hover:text-[#10b981] hover:shadow-md sm:inline-flex dark:border-white/10 dark:bg-transparent dark:text-gray-300"
                >
                  {t("landingLoginBtn")}
                </Link>
              ) : (
                <div className="hidden sm:block">
                  <UserInfo />
                </div>
              )}

              {(!session.data || (session.data.user as any).role !== "user") && (
                <Link
                  href="/dashboard"
                  className="btn-glow hidden items-center justify-center rounded-xl bg-[#10b981] px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#059669] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] sm:inline-flex"
                >
                  {t("landingDashboardBtn")}
                </Link>
              )}
            </div>

            {/* ── Mobile Menu Button ── */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-[#10b981]/30 md:hidden dark:border-white/10 dark:bg-transparent"
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-5 rounded-full bg-gray-500 transition-all duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-gray-500 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-gray-500 transition-all duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className={`overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl transition-all duration-500 md:hidden dark:border-white/5 dark:bg-gray-dark/95 ${
            menuOpen ? "max-h-[500px] py-4 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-gray-500 transition-colors hover:bg-[#10b981]/8 hover:text-[#10b981] dark:text-gray-300"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 px-4">
              <div className="flex items-center gap-4 py-2">
                <LanguageToggle />
                <ThemeToggleSwitch />
              </div>
              {session.data && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                  <div className="scale-90 origin-right">
                    <UserInfo />
                  </div>
                  <span className="text-sm font-medium text-dark dark:text-white">{isAr ? "حسابي" : "My Account"}</span>
                </div>
              )}
              <div className="flex gap-3 w-full">
                {!session.data ? (
                  <Link
                    href="/auth/sign-in"
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-bold text-gray-500 hover:border-[#10b981]/30 dark:border-white/10"
                  >
                    {t("landingLoginBtn")}
                  </Link>
                ) : null}
                {(!session.data || (session.data.user as any).role !== "user") && (
                  <Link
                    href="/dashboard"
                    className="flex-1 rounded-xl bg-[#10b981] py-2.5 text-center text-sm font-bold text-white hover:bg-[#059669]"
                  >
                    {t("landingDashboardBtn")}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
