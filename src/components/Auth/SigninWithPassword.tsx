"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { GoogleIcon } from "@/assets/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (e.target.name === "email" && /^\d+$/.test(value) && value.length > 9) {
      value = value.slice(0, 9);
    }

    setData({
      ...data,
      [e.target.name]: value,
    });
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      await authClient.signIn.social({ provider: "google", callbackURL: callbackUrl });
    } catch {
      toast.error(t("signInError"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValidID = /^\d{9}$/.test(data.email);
    const isValidEmail = data.email.includes("@");

    if (!isValidID && !isValidEmail) {
      toast.error(t("invalidIdOrEmailError"));
      return;
    }

    setLoading(true);

    const finalEmail = isValidID ? `${data.email}@sa3dne.local` : data.email;

    const { error } = await authClient.signIn.email({
      email: finalEmail,
      password: data.password,
    });

    setLoading(false);

    if (error) {
      // Check if the user is banned
      if (error.code === "USER_BANNED" || error.message?.toLowerCase().includes("banned")) {
        toast.error(
          t("bannedError"),
          { duration: 8000, id: "banned-error" }
        );
      } else {
        toast.error(t("signInError"));
      }
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Google Sign-in Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-dark transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        {googleLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-gray-400 border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {t("signInWithGoogle")}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        <span className="text-xs text-dark-4 dark:text-dark-6">{t("orSignUpWith")}</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
      </div>
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
            type="text"
            name="email"
            required
            value={data.email}
            onChange={handleChange}
            placeholder="123456789 أو example@sa3dne.com"
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

      <p className="mt-4 text-center text-sm font-medium text-dark-4 dark:text-dark-6">
        {t("noAccountQuestion")}{" "}
        <Link href="/auth/sign-up" className="font-bold text-[#10b981] hover:underline">
          {t("signUpLinkText")}
        </Link>
      </p>
    </div>
  );
}
