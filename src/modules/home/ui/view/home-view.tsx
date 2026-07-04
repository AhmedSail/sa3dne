"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  HandHeart,
  MapPin,
  ShieldCheck,
  Users,
  ArrowLeft,
  Menu,
  X,
  HeartHandshake,
  TrendingUp,
  Box,
  Layers,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";

export default function HomeView() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
        },
      },
    });
  };

  const navLinks = [
    { name: "الرئيسية", href: "#" },
    { name: "المميزات", href: "#features" },
    { name: "آلية العمل", href: "#how-it-works" },
    { name: "تواصل معنا", href: "#contact" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans selection:bg-green-500/30 overflow-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-lg border-b-2 border-border shadow-[0_4px_30px_rgba(0,0,0,0.05)] py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-white p-1 rounded-xl border-2 border-green-100 shadow-[4px_4px_0_rgba(21,128,61,0.1)] group-hover:shadow-[6px_6px_0_rgba(21,128,61,0.15)] group-hover:-translate-y-0.5 transition-all">
                <Image src="/logo.svg" alt="sa3nde logo" width={40} height={40} className="w-10 h-10" />
              </div>
              <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-500 tracking-tight">
                ساعدني
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 font-bold text-muted-foreground">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="hover:text-green-600 hover:-translate-y-0.5 transition-all"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              {!isPending && (
                <>
                  {session ? (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-muted-foreground bg-muted px-4 py-2 rounded-xl border-2 border-border shadow-[2px_2px_0_rgba(0,0,0,0.05)]">
                        مرحباً، {session.user.name}
                      </span>
                      <button
                        onClick={handleSignOut}
                        className="rounded-xl border-2 border-border bg-background px-5 py-2.5 font-bold text-foreground shadow-[3px_3px_0_rgba(0,0,0,0.1)] hover:shadow-[1px_1px_0_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:translate-x-[-2px] transition-all"
                      >
                        تسجيل الخروج
                      </button>
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-xl border-2 border-green-700 bg-green-600 px-5 py-2.5 font-bold text-white shadow-[3px_3px_0_rgb(21,128,61)] hover:shadow-[1px_1px_0_rgb(21,128,61)] hover:translate-y-[2px] hover:translate-x-[-2px] transition-all"
                      >
                        لوحة التحكم
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href="/sign-in">
                        <button className="rounded-xl border-2 border-transparent px-5 py-2.5 font-bold text-muted-foreground hover:text-green-700 hover:bg-green-50 transition-all">
                          تسجيل الدخول
                        </button>
                      </Link>
                      <Link href="/sign-up">
                        <button className="rounded-xl border-2 border-green-700 bg-green-600 px-6 py-2.5 font-bold text-white shadow-[4px_4px_0_rgb(21,128,61)] hover:shadow-[2px_2px_0_rgb(21,128,61)] hover:translate-y-[2px] hover:translate-x-[-2px] transition-all">
                          حساب جديد
                        </button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-foreground rounded-xl border-2 border-border shadow-[2px_2px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[2px] transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b-2 border-border shadow-[0_10px_20px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-bold p-3 hover:bg-muted rounded-xl border-2 border-transparent hover:border-border transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t-2 border-border">
              {session ? (
                <>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-xl border-2 border-green-700 bg-green-600 px-5 py-3 font-bold text-white shadow-[3px_3px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[3px] transition-all"
                  >
                    لوحة التحكم
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-xl border-2 border-border bg-background px-5 py-3 font-bold text-foreground shadow-[3px_3px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/sign-in" className="w-full">
                    <button className="w-full rounded-xl border-2 border-border bg-background px-5 py-3 font-bold text-foreground shadow-[3px_3px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all">
                      تسجيل الدخول
                    </button>
                  </Link>
                  <Link href="/sign-up" className="w-full">
                    <button className="w-full rounded-xl border-2 border-green-700 bg-green-600 px-5 py-3 font-bold text-white shadow-[3px_3px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[3px] transition-all">
                      حساب جديد
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
          {/* 3D Background Grid - The "Squares" */}
          <div className="absolute inset-0 -z-20 bg-background bg-[linear-gradient(to_right,#16a34a20_2px,transparent_2px),linear-gradient(to_bottom,#16a34a20_2px,transparent_2px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_90%_60%_at_50%_10%,#000_60%,transparent_100%)]"></div>
          
          {/* 3D Floating Elements */}
          <div className="absolute top-32 right-[5%] lg:right-[15%] -z-10 w-24 h-24 md:w-32 md:h-32 bg-green-500 rounded-3xl opacity-80 shadow-[-15px_15px_0_rgba(21,128,61,0.3)] border-2 border-green-400 animate-[bounce_5s_infinite]" style={{ transform: 'perspective(1000px) rotateX(25deg) rotateY(-25deg) rotateZ(10deg)' }}>
            <div className="absolute inset-2 border-2 border-white/40 rounded-2xl"></div>
          </div>
          <div className="absolute bottom-20 left-[5%] lg:left-[10%] -z-10 w-20 h-20 md:w-28 md:h-28 bg-emerald-400 rounded-3xl opacity-70 shadow-[15px_15px_0_rgba(16,185,129,0.3)] border-2 border-emerald-300 animate-[bounce_6s_infinite_1s]" style={{ transform: 'perspective(1000px) rotateX(-20deg) rotateY(30deg) rotateZ(-15deg)' }}>
            <div className="absolute inset-2 border-2 border-white/40 rounded-2xl"></div>
          </div>
          <div className="absolute top-1/2 left-[15%] -z-10 w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-2xl opacity-50 shadow-[10px_10px_0_rgba(59,130,246,0.3)] border-2 border-blue-400 animate-[bounce_4s_infinite_0.5s]" style={{ transform: 'perspective(1000px) rotateX(15deg) rotateY(40deg) rotateZ(20deg)' }}></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              {/* 3D Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-green-200 text-green-700 font-bold text-sm mb-4 shadow-[4px_4px_0_rgba(21,128,61,0.1)] transform -rotate-2 hover:rotate-0 transition-transform">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                المنصة الموحدة لإدارة المساعدات
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-[1.1]">
                ربط المبادرات <br />
                <span className="relative inline-block mt-2">
                  <span className="absolute -inset-2 bg-green-100 rounded-2xl -z-10 rotate-2 border-2 border-green-200 shadow-[4px_4px_0_rgba(21,128,61,0.1)]"></span>
                  <span className="text-green-700 relative z-10">
                    بالمخيمات المحتاجة
                  </span>
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium mt-8">
                منصة "ساعدني" تنظم عملية إيصال المساعدات للنازحين بشفافية وعدالة، لتكون جسراً موثوقاً بين المتبرعين والمخيمات.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <Link href="/sign-up">
                  <button className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-green-600 border-2 border-green-700 px-8 py-4 text-xl font-black text-white transition-all shadow-[0_8px_0_rgb(21,128,61)] hover:shadow-[0_4px_0_rgb(21,128,61)] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]">
                    ابدأ معنا الآن
                    <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-2" />
                  </button>
                </Link>
                <Link href="#how-it-works">
                  <button className="w-full sm:w-auto rounded-2xl border-2 border-border bg-background px-8 py-4 text-xl font-bold text-foreground shadow-[0_8px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_0_rgba(0,0,0,0.1)] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] transition-all">
                    كيف تعمل المنصة؟
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Features Section */}
        <section id="features" className="py-24 bg-green-50/50 border-y-2 border-border relative">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-6 inline-block relative">
                لماذا منصة <span className="text-green-600">"ساعدني"</span>؟
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-2 bg-green-400 rounded-full"></div>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1 */}
              <div className="group bg-background rounded-3xl p-8 border-2 border-border shadow-[8px_8px_0_rgba(21,128,61,0.15)] hover:shadow-[12px_12px_0_rgba(21,128,61,0.25)] hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-green-100 border-2 border-green-200 flex items-center justify-center mb-8 text-green-600 shadow-[4px_4px_0_rgba(21,128,61,0.2)] group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">تنسيق المساعدات</h3>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  تحديد المخيمات المستهدفة ورفع خطط توزيع المساعدات بشكل منظم وموثق بطريقة مرئية سهلة.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group bg-background rounded-3xl p-8 border-2 border-border shadow-[8px_8px_0_rgba(59,130,246,0.15)] hover:shadow-[12px_12px_0_rgba(59,130,246,0.25)] hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center mb-8 text-blue-600 shadow-[4px_4px_0_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">تأكيد الاستلام</h3>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  نظام دقيق يتيح لمدراء المخيمات تأكيد استلام المساعدات بالكميات الفعلية لضمان الشفافية العالية.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group bg-background rounded-3xl p-8 border-2 border-border shadow-[8px_8px_0_rgba(249,115,22,0.15)] hover:shadow-[12px_12px_0_rgba(249,115,22,0.25)] hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 border-2 border-orange-200 flex items-center justify-center mb-8 text-orange-600 shadow-[4px_4px_0_rgba(249,115,22,0.2)] group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">إحصائيات ذكية</h3>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  لوحات تحكم ثلاثية الأبعاد توفر رؤية شاملة حول احتياجات المخيمات لدعم اتخاذ القرار.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3D Isometric How It Works */}
        <section id="how-it-works" className="py-32 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col lg:flex-row gap-20 items-center">
              
              <div className="flex-1 space-y-12">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-6">آلية العمل في المنصة</h2>
                  <p className="text-muted-foreground font-medium text-xl">
                    خطوات بسيطة وفعالة في بيئة عمل متطورة تربط بين مقدمي المساعدات والمخيمات.
                  </p>
                </div>

                <div className="space-y-8 relative before:absolute before:inset-y-0 before:right-6 before:w-1 before:bg-green-100 before:-z-10">
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-green-600 border-2 border-green-700 text-white flex items-center justify-center font-black text-xl shadow-[0_4px_0_rgb(21,128,61)] shrink-0">1</div>
                    <div className="pt-2">
                      <h4 className="text-2xl font-black mb-3">تسجيل الجهة المانحة</h4>
                      <p className="text-muted-foreground font-medium text-lg">تقوم المؤسسة بإنشاء حساب وتحديد المساعدات المتاحة وتوثيق هويتها.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-green-200 text-green-600 flex items-center justify-center font-black text-xl shadow-[0_4px_0_rgba(21,128,61,0.2)] shrink-0">2</div>
                    <div className="pt-2">
                      <h4 className="text-2xl font-black mb-3">توجيه الدعم للمخيمات</h4>
                      <p className="text-muted-foreground font-medium text-lg">تحليل ذكي لاحتياجات المخيمات يسهل عملية استهداف المخيمات الأكثر تضرراً.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-green-200 text-green-600 flex items-center justify-center font-black text-xl shadow-[0_4px_0_rgba(21,128,61,0.2)] shrink-0">3</div>
                    <div className="pt-2">
                      <h4 className="text-2xl font-black mb-3">تأكيد الاستلام بشفافية</h4>
                      <p className="text-muted-foreground font-medium text-lg">استلام إشعارات فورية وتقارير بتأكيد وصول المساعدات لمدراء المخيمات.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Isometric Illustration */}
              <div className="flex-1 w-full max-w-lg mx-auto flex justify-center items-center h-[500px]">
                <div className="relative w-full h-full perspective-[1200px]">
                  <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(55deg) rotateZ(-45deg)' }}>
                    
                    {/* Base Platform */}
                    <div className="absolute w-72 h-72 bg-green-500/20 rounded-3xl border-2 border-green-500/30" style={{ transform: 'translateZ(-60px)', boxShadow: '0 40px 100px -10px rgba(21,128,61,0.5)' }}></div>
                    <div className="absolute w-72 h-72 bg-gradient-to-br from-green-300 to-green-500 rounded-3xl border-2 border-green-400 opacity-90" style={{ transform: 'translateZ(-20px)' }}></div>
                    
                    {/* Floating 3D UI Card */}
                    <div className="absolute w-64 h-64 bg-white rounded-3xl border-4 border-green-600 p-6 flex flex-col gap-4 shadow-2xl transition-transform duration-1000 animate-[bounce_4s_infinite]" style={{ transform: 'translateZ(40px)', boxShadow: '-20px 30px 40px rgba(0,0,0,0.2)' }}>
                      
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-6 w-1/3 bg-green-200 rounded-lg"></div>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        </div>
                      </div>

                      {/* Card Content Bars */}
                      <div className="flex-1 bg-green-50 rounded-2xl border-2 border-green-100 p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-300 shadow-inner"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-3 w-3/4 bg-green-200 rounded"></div>
                            <div className="h-3 w-1/2 bg-green-200 rounded"></div>
                          </div>
                        </div>
                        <div className="h-full bg-white rounded-xl border-2 border-green-100 mt-2 p-3 flex flex-col justify-end gap-2">
                           <div className="h-2 w-full bg-green-100 rounded"></div>
                           <div className="h-2 w-5/6 bg-green-100 rounded"></div>
                           <div className="h-2 w-4/6 bg-green-200 rounded"></div>
                        </div>
                      </div>
                      
                      {/* Success Button */}
                      <div className="h-12 bg-green-500 rounded-xl border-b-4 border-green-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        تم التأكيد ✓
                      </div>
                    </div>

                    {/* Floating mini cubes */}
                    <div className="absolute w-16 h-16 bg-blue-400 rounded-xl border-2 border-blue-300 animate-[bounce_5s_infinite_1s]" style={{ transform: 'translateZ(120px) translateX(-100px) translateY(50px)' }}></div>
                    <div className="absolute w-12 h-12 bg-orange-400 rounded-xl border-2 border-orange-300 animate-[bounce_6s_infinite_2s]" style={{ transform: 'translateZ(90px) translateX(100px) translateY(-80px)' }}></div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3D CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="bg-green-600 rounded-[3rem] p-10 md:p-20 border-b-[12px] border-green-800 text-center text-white shadow-[0_20px_50px_rgba(21,128,61,0.5)] max-w-6xl mx-auto relative overflow-hidden">
              
              {/* Background patterns for CTA */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%,rgba(255,255,255,0.1)_100%)] bg-[size:40px_40px]"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-8 drop-shadow-md">كن جزءاً من التغيير الإيجابي</h2>
                <p className="text-green-100 text-xl md:text-2xl font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
                  انضم إلى المنصة الرائدة في إدارة المخيمات وتنسيق المساعدات، لنعمل معاً 
                  على إيصال الدعم لمن يستحقه بكل شفافية ومصداقية.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link href="/sign-up">
                    <button className="w-full sm:w-auto rounded-2xl bg-white border-b-4 border-green-200 px-10 py-5 text-2xl font-black text-green-700 shadow-xl hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all">
                      إنشاء حساب مجاني
                    </button>
                  </Link>
                  <Link href="/sign-in">
                    <button className="w-full sm:w-auto rounded-2xl bg-green-700 border-b-4 border-green-900 px-10 py-5 text-2xl font-black text-white shadow-xl hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all">
                      تسجيل الدخول
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-background py-16 border-t-4 border-border mt-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-xl border-b-4 border-green-800">
                <Image src="/logo.svg" alt="sa3nde logo" width={40} height={40} className="w-10 h-10 brightness-0 invert" />
              </div>
              <span className="text-3xl font-black text-foreground">ساعدني</span>
            </div>
            
            <div className="flex items-center gap-8 text-lg font-bold text-muted-foreground">
              <Link href="#" className="hover:text-green-600 hover:-translate-y-1 transition-transform">الشروط والأحكام</Link>
              <Link href="#" className="hover:text-green-600 hover:-translate-y-1 transition-transform">سياسة الخصوصية</Link>
              <Link href="#" className="hover:text-green-600 hover:-translate-y-1 transition-transform">تواصل معنا</Link>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t-2 border-border flex flex-col md:flex-row justify-between items-center gap-4 text-base font-bold text-muted-foreground">
            <p>© 2026 منصة ساعدني. جميع الحقوق محفوظة.</p>
            <p className="flex items-center gap-2">
              مشروع تخرج - نظام إدارة مخيمات النازحين 
              <HeartHandshake className="w-5 h-5 text-green-600" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
