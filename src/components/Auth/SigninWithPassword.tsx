"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function SigninWithPassword() {
  const router = useRouter();
  const { t } = useLanguage();
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    setLoading(false);

    if (error) {
      toast.error(t("signInError"));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="example@sa3dne.com"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#10b981]"
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
          placeholder="••••••••"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#10b981]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#10b981] px-6 py-4 text-sm font-black text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#059669] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
            جاري تسجيل الدخول...
          </>
        ) : (
          t("signInButton")
        )}
      </button>
    </form>
  );
}
