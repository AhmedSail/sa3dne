"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

interface LandingStats {
  totalCamps: number;
  totalFamilies: number;
  totalIndividuals: number;
  totalContributions: number;
}

/* ─── Count-up Hook ─── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!start || target === 0) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);
  return count;
}

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── 3D Tilt Hook ─── */
function useTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale3d(1.03,1.03,1.03)`;
    ref.current.style.transition = "transform 0.1s ease-out";
  }, [strength]);
  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    ref.current.style.transition = "transform 0.5s ease-out";
  }, []);
  return { ref, handleMouseMove, handleMouseLeave };
}

/* ─── Stat Card ─── */
function StatCard({ value, label, icon, delay, start }: { value: number; label: string; icon: React.ReactNode; delay: number; start: boolean }) {
  const animated = useCountUp(value, 2000, start);
  const tilt = useTilt(10);
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouseMove}
      onMouseLeave={tilt.handleMouseLeave}
      className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:border-[#10b981]/20 dark:border-white/5 dark:bg-[#0f1c2e]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981]/10 text-[#10b981] ring-2 ring-[#10b981]/20" style={{ transform: "translateZ(24px)" }}>
        {icon}
      </div>
      <p className="text-4xl font-black text-dark dark:text-white tabular-nums" style={{ transform: "translateZ(16px)" }}>
        {animated.toLocaleString()}+
      </p>
      <p className="text-center text-sm font-semibold text-gray-400" style={{ transform: "translateZ(8px)" }}>{label}</p>
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, color, delay, inView }: {
  icon: React.ReactNode; title: string; desc: string; color: string; delay: number; inView: boolean;
}) {
  const tilt = useTilt(14);
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouseMove}
      onMouseLeave={tilt.handleMouseLeave}
      className={`flex flex-col gap-5 rounded-2xl border border-white/5 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-700 dark:border-white/5 dark:bg-[#0f1c2e] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transformStyle: "preserve-3d", transitionDelay: `${delay}ms` }}
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} shadow-lg`} style={{ transform: "translateZ(28px)" }}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-dark dark:text-white" style={{ transform: "translateZ(18px)" }}>{title}</h3>
      <p className="text-sm font-medium leading-relaxed text-gray-400" style={{ transform: "translateZ(10px)" }}>{desc}</p>
    </div>
  );
}

/* ─── Step Row ─── */
function StepRow({ num, title, desc, active, delay, inView }: {
  num: number; title: string; desc: string; active: boolean; delay: number; inView: boolean;
}) {
  return (
    <div className={`flex gap-5 transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black shadow-md transition-all ${active ? "bg-[#10b981] text-white shadow-[#10b981]/30" : "border-2 border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-[#0f1c2e]"}`}>
        {num}
      </div>
      <div>
        <h4 className="mb-1.5 text-lg font-black text-dark dark:text-white">{title}</h4>
        <p className="text-sm font-medium leading-relaxed text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

/* ─── 3D Isometric Illustration ─── */
function IsometricIllustration({ inView }: { inView: boolean }) {
  return (
    <div className={`relative flex items-center justify-center transition-all duration-1000 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
      <div className="relative h-[380px] w-[380px]" style={{ perspective: "1200px" }}>
        {/* Back shadow */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-20 w-64 rounded-full bg-[#10b981]/10 blur-2xl" />

        {/* Layer 3 – base */}
        <div
          className="absolute animate-float3 rounded-3xl bg-[#10b981]/15"
          style={{
            width: 260, height: 160,
            top: 130, left: 60,
            transform: "rotateX(55deg) rotateZ(-45deg)",
          }}
        />
        {/* Layer 2 – middle */}
        <div
          className="absolute animate-float2 rounded-3xl bg-[#10b981]/40 shadow-[0_30px_60px_rgba(16,185,129,0.3)]"
          style={{
            width: 240, height: 150,
            top: 90, left: 70,
            transform: "rotateX(55deg) rotateZ(-45deg)",
          }}
        />
        {/* Layer 1 – top card with fake UI */}
        <div
          className="absolute animate-float1 rounded-3xl border border-white/30 bg-white shadow-[0_40px_80px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-[#0f1c2e]"
          style={{
            width: 230, height: 145,
            top: 50, left: 75,
            transform: "rotateX(55deg) rotateZ(-45deg)",
          }}
        >
          <div className="flex flex-col gap-3 p-5">
            <div className="h-3 w-14 rounded-full bg-orange-400" />
            <div className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded-xl bg-[#10b981]" />
              <div className="flex flex-col gap-1.5">
                <div className="h-2.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-2 w-14 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div className="h-7 w-full rounded-lg bg-[#10b981]/80" />
          </div>
        </div>

        {/* Floating badge top-right */}
        <div
          className="animate-float1 absolute right-4 top-8 rounded-2xl border border-[#10b981]/20 bg-white px-4 py-2 shadow-xl dark:bg-[#0f1c2e]"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            <span className="text-xs font-bold text-[#10b981]">تم الاستلام ✓</span>
          </div>
        </div>

        {/* Floating badge bottom-left */}
        <div
          className="animate-float2 absolute bottom-8 left-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 shadow-xl dark:border-white/5 dark:bg-[#0f1c2e]"
          style={{ animationDelay: "1s" }}
        >
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-blue-500">128 عائلة مستفيدة</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function LandingClient({ stats }: { stats: LandingStats }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const heroRef = useRef<HTMLDivElement>(null);
  const { ref: statsRef, inView: statsInView } = useInView(0.2);
  const { ref: featRef, inView: featInView } = useInView(0.1);
  const { ref: howRef, inView: howInView } = useInView(0.1);
  const { ref: ctaRef, inView: ctaInView } = useInView(0.2);

  return (
    <>
      {/* ─── Global animation styles ─── */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:rotateX(55deg) rotateZ(-45deg) translateY(0px)} 50%{transform:rotateX(55deg) rotateZ(-45deg) translateY(-12px)} }
        @keyframes float2 { 0%,100%{transform:rotateX(55deg) rotateZ(-45deg) translateY(0px)} 50%{transform:rotateX(55deg) rotateZ(-45deg) translateY(-7px)} }
        @keyframes float3 { 0%,100%{transform:rotateX(55deg) rotateZ(-45deg) translateY(0px)} 50%{transform:rotateX(55deg) rotateZ(-45deg) translateY(-4px)} }
        @keyframes badge-float1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes badge-float2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-5px)} }
        .animate-float1 { animation: float1 4s ease-in-out infinite; }
        .animate-float2 { animation: float2 5s ease-in-out infinite; }
        .animate-float3 { animation: float3 6s ease-in-out infinite; }
        .animate-badge1 { animation: badge-float1 3s ease-in-out infinite; }
        .animate-badge2 { animation: badge-float2 4s ease-in-out infinite 1s; }
        @keyframes heroFadeIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .hero-fade { animation: heroFadeIn 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hero-fade-2 { animation: heroFadeIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards; opacity:0; }
        .hero-fade-3 { animation: heroFadeIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; opacity:0; }
        .hero-fade-4 { animation: heroFadeIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s forwards; opacity:0; }
      `}</style>

      <div className="flex flex-col" dir={isAr ? "rtl" : "ltr"}>

        {/* ────── HERO ────── */}
        <section
          ref={heroRef}
          className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-28 text-center sm:px-6 lg:pt-36 lg:pb-28"
        >
          {/* Gradient bg blobs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-48 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#10b981]/8 blur-[120px]" />
            <div className="absolute top-20 right-[10%] h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
            <div className="absolute bottom-0 left-[15%] h-48 w-48 rounded-full bg-[#10b981]/5 blur-3xl" />
          </div>

          {/* Badge */}
          <div className="hero-fade mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/20 bg-[#10b981]/8 px-5 py-2 text-sm font-bold text-[#10b981]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981]" />
              {t("mockupHeroBadge")}
            </span>
          </div>

          {/* Title */}
          <h1 className="hero-fade-2 mx-auto mb-6 max-w-4xl text-5xl font-black leading-[1.15] tracking-tight text-dark dark:text-white sm:text-6xl lg:text-[76px]">
            {t("mockupHeroTitle1")}
            <br />
            <span className="relative mt-2 inline-block">
              <span className="relative z-10 text-dark dark:text-white px-3">{t("mockupHeroTitle2")}</span>
              <span className="absolute inset-0 -z-0 -rotate-1 rounded-xl bg-[#10b981] opacity-90 scale-105" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-fade-3 mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-gray-400 sm:text-xl">
            {t("mockupHeroSub")}
          </p>

          {/* Buttons */}
          <div className="hero-fade-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/sign-in"
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl bg-[#10b981] px-8 py-4 text-sm font-black text-white shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,185,129,0.5)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#10b981] to-[#059669] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative">{t("mockupStartBtn")}</span>
              <svg className={`relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isAr ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7M3 12h18" />
              </svg>
            </Link>
            <Link
              href="/#how-it-works"
              className="rounded-xl border-2 border-gray-200 bg-white/80 px-8 py-4 text-sm font-black text-gray-500 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#10b981]/30 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            >
              {t("mockupHowBtn")}
            </Link>
          </div>
        </section>

        {/* ────── STATS STRIP ────── */}
        <section ref={statsRef} className="border-y border-gray-100 bg-white px-4 py-12 dark:border-white/5 dark:bg-[#050a15] sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              { value: stats.totalCamps, label: t("landingStatCamps"), icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
              { value: stats.totalFamilies, label: t("landingStatFamilies"), icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
              { value: stats.totalIndividuals, label: t("landingStatIndividuals"), icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
              { value: stats.totalContributions, label: t("landingStatContributions"), icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
            ].map((s, i) => (
              <StatCard key={i} {...s} delay={i * 100} start={statsInView} />
            ))}
          </div>
        </section>

        {/* ────── WHY SA3DNE ────── */}
        <section id="features" className="bg-[#fafbfc] px-4 py-24 dark:bg-[#050a15] sm:px-6">
          <div ref={featRef} className="mx-auto max-w-[1200px]">
            <div className={`mb-16 text-center transition-all duration-700 ${featInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <h2 className="text-3xl font-black text-dark dark:text-white sm:text-4xl lg:text-5xl">
                {isAr ? <>لماذا منصة <span className="relative inline-block text-[#10b981]">"ساعدني"<span className="absolute bottom-0 inset-x-0 h-1 rounded-full bg-[#10b981]/30"/></span>؟</> : t("mockupWhyTitle")}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard inView={featInView} delay={0} color="bg-gradient-to-br from-[#10b981] to-[#059669] text-white" title={t("mockupFeat1Title")} desc={t("mockupFeat1Desc")}
                icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
              />
              <FeatureCard inView={featInView} delay={120} color="bg-gradient-to-br from-blue-500 to-blue-600 text-white" title={t("mockupFeat2Title")} desc={t("mockupFeat2Desc")}
                icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              />
              <FeatureCard inView={featInView} delay={240} color="bg-gradient-to-br from-orange-400 to-orange-500 text-white" title={t("mockupFeat3Title")} desc={t("mockupFeat3Desc")}
                icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              />
            </div>
          </div>
        </section>

        {/* ────── PUBLIC COMPLAINTS SECTION ────── */}
        <section id="complaints" className="bg-white px-4 py-24 dark:bg-[#020d1a] sm:px-6">
          <div className={`mx-auto max-w-[1200px] transition-all duration-700 ${featInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            
            <div className="mb-12 text-center">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-bold text-orange-500 dark:bg-orange-500/10">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {isAr ? "متاح للجميع · دون حساب" : "Open to all · No account needed"}
              </span>
              <h2 className="text-3xl font-black text-dark dark:text-white sm:text-4xl lg:text-5xl">
                {isAr ? "صوتك يُسمع" : "Your Voice Matters"}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base font-medium text-gray-400">
                {isAr
                  ? "يمكنك تقديم شكوى أو اقتراح وتتبع حالتها دون الحاجة لإنشاء حساب."
                  : "Submit a complaint or suggestion and track its status without creating an account."}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Card 1 - Submit */}
              <Link
                href="/feedback"
                className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/5 to-[#10b981]/10 p-10 transition-all duration-500 hover:-translate-y-2 hover:border-[#10b981]/60 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] dark:from-[#10b981]/5 dark:to-[#10b981]/10"
              >
                <div className="absolute top-0 end-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-[#10b981]/10 blur-2xl transition-all duration-500 group-hover:scale-150" />
                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10b981] text-white shadow-[0_8px_20px_rgba(16,185,129,0.4)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-2xl font-black text-dark dark:text-white">
                      {isAr ? "تقديم شكوى" : "Submit a Complaint"}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-400">
                      {isAr
                        ? "قدّم شكواك أو اقتراحك مباشرة لإدارة المخيم بكل سهولة وسرية."
                        : "Submit your complaint or suggestion directly to camp management with ease and confidentiality."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-black text-[#10b981]">
                    {isAr ? "ابدأ الآن" : "Get started"}
                    <svg className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isAr ? "rotate-180 group-hover:-translate-x-1" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7M3 12h18" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Card 2 - Track */}
              <Link
                href="/track"
                className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-blue-300/40 bg-gradient-to-br from-blue-50 to-blue-100/50 p-10 transition-all duration-500 hover:-translate-y-2 hover:border-blue-400/60 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] dark:from-blue-500/5 dark:to-blue-500/10 dark:border-blue-500/20"
              >
                <div className="absolute top-0 end-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-blue-400/10 blur-2xl transition-all duration-500 group-hover:scale-150" />
                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.4)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-2 text-2xl font-black text-dark dark:text-white">
                      {isAr ? "تتبع شكواك" : "Track Your Complaint"}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-400">
                      {isAr
                        ? "أدخل رقم التتبع الخاص بك لمعرفة آخر تحديثات شكواك أو اقتراحك."
                        : "Enter your tracking number to see the latest updates on your complaint or suggestion."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-black text-blue-500">
                    {isAr ? "تتبع الآن" : "Track now"}
                    <svg className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isAr ? "rotate-180 group-hover:-translate-x-1" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7M3 12h18" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ────── HOW IT WORKS ────── */}
        <section id="how-it-works" className="overflow-hidden bg-white px-4 py-24 dark:bg-[#020d1a] sm:px-6">
          <div ref={howRef} className="mx-auto flex max-w-[1200px] flex-col items-center gap-16 lg:flex-row">
            {/* 3D Illustration */}
            <div className={`flex w-full flex-1 justify-center ${isAr ? "lg:order-last" : ""}`}>
              <IsometricIllustration inView={howInView} />
            </div>

            {/* Steps */}
            <div className="flex w-full flex-1 flex-col">
              <div className={`mb-10 transition-all duration-700 ${howInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <h2 className="mb-3 text-3xl font-black text-dark dark:text-white sm:text-4xl">{t("mockupHowTitle")}</h2>
                <p className="text-base font-medium text-gray-400">{t("mockupHowSub")}</p>
              </div>
              <div className="flex flex-col gap-8">
                <StepRow inView={howInView} delay={0} num={1} title={t("mockupStep1Title")} desc={t("mockupStep1Desc")} active={true} />
                <StepRow inView={howInView} delay={100} num={2} title={t("mockupStep2Title")} desc={t("mockupStep2Desc")} active={false} />
                <StepRow inView={howInView} delay={200} num={3} title={t("mockupStep3Title")} desc={t("mockupStep3Desc")} active={false} />
              </div>
            </div>
          </div>
        </section>

        {/* ────── CTA BANNER ────── */}
        <section ref={ctaRef} className="bg-[#fafbfc] px-4 py-20 dark:bg-[#020d1a] sm:px-6">
          <div className={`mx-auto max-w-[1100px] transition-all duration-1000 ${ctaInView ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"}`}>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#10b981] to-[#059669] px-8 py-20 text-center shadow-[0_30px_80px_rgba(16,185,129,0.4)]">
              {/* shimmer blobs */}
              <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)]" />

              <div className="relative z-10">
                <h2 className="mb-4 text-3xl font-black text-white sm:text-5xl drop-shadow-sm">{t("mockupCtaTitle")}</h2>
                <p className="mx-auto mb-10 max-w-2xl text-base font-semibold text-white/85 sm:text-lg">{t("mockupCtaDesc")}</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/auth/sign-in"
                    className="group relative overflow-hidden rounded-xl bg-white px-8 py-4 text-sm font-black text-[#10b981] shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
                  >
                    {t("landingLoginBtn")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
