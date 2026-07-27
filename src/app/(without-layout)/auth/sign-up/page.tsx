import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthBanner } from "@/components/Auth/AuthBanner";
import SignupWithPassword from "@/components/Auth/SignupWithPassword";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "إنشاء حساب | ساعدني",
  description: "إنشاء حساب جديد للانضمام إلى منصة ساعدني",
};

export default function SignUp() {
  return (
    <div className="flex min-h-screen flex-wrap items-center">
      <div className="w-full xl:w-1/2">
        <div className="mx-auto w-full max-w-[570px] p-4 sm:p-12.5 xl:p-15">
          <div className="mb-8 text-center xl:hidden">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo/logo.png"
                alt="Sa3dne"
                width={160}
                height={160}
                className="mx-auto object-contain"
              />
            </Link>
            <h1 className="text-2xl font-bold text-dark dark:text-white sm:text-3xl">
              إنشاء حساب جديد
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              انضم إلى منصة ساعدني الآن
            </p>
          </div>
          <div className="hidden xl:block mb-8 text-center">
            <h1 className="text-2xl font-bold text-dark dark:text-white sm:text-3xl">
              إنشاء حساب جديد
            </h1>
          </div>
          <Suspense fallback={<div>جاري التحميل...</div>}>
            <SignupWithPassword />
          </Suspense>
        </div>
      </div>

      <div className="hidden w-full p-6 xl:block xl:w-1/2">
        <AuthBanner type="signup" />
      </div>
    </div>
  );
}
