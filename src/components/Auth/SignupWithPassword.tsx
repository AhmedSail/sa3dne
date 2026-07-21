"use client";

import { signUp } from "@/lib/auth/auth-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function SignupWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const callbackURL = searchParams.get("callbackUrl") || "/dashboard";

      await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL,
      });
      router.push(callbackURL);
      toast.success(t("signUpSuccess"));
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : ((err as { error?: { message?: string } }).error?.message ??
            t("signUpError"));
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-dark dark:text-white"
        >
          {t("nameLabel")}
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          value={data.name}
          onChange={handleChange}
          placeholder={t("namePlaceholder")}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#10b981]"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-dark dark:text-white"
        >
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          value={data.email}
          onChange={handleChange}
          placeholder={t("emailPlaceholder")}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#10b981]"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-dark dark:text-white"
        >
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          value={data.password}
          onChange={handleChange}
          placeholder={t("passwordPlaceholder")}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#10b981]"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#10b981] px-6 py-4 text-sm font-black text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#059669] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
              جاري إنشاء الحساب...
            </>
          ) : (
            t("signUpButton")
          )}
        </button>
      </div>

      {error && (
        <p className="text-center text-sm font-bold text-red-500">{error}</p>
      )}

      <p className="mt-6 text-center text-sm font-medium text-dark-4 dark:text-dark-6">
        لديك حساب بالفعل؟{" "}
        <Link
          href="/auth/sign-in"
          className="font-bold text-[#10b981] hover:underline"
        >
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
