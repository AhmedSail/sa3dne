"use client";

import { signUp, authClient } from "@/lib/auth/auth-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { GoogleIcon } from "@/assets/icons";
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
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const callbackURL = searchParams.get("callbackUrl") || "/";
      await authClient.signIn.social({ provider: "google", callbackURL });
    } catch {
      toast.error(t("signUpError"));
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (data.password !== data.confirmPassword) {
      const msg = t("passwordMismatchError");
      setError(msg);
      toast.error(msg);
      return;
    }

    const isValidID = /^\d{9}$/.test(data.email);
    const isValidEmail = data.email.includes("@");

    if (!isValidID && !isValidEmail) {
      const msg = t("invalidIdOrEmailError");
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const callbackURL = searchParams.get("callbackUrl") || "/";
      const finalEmail = isValidID ? `${data.email}@sa3dne.local` : data.email;

      await signUp.email({
        name: data.name,
        email: finalEmail,
        password: data.password,
        phone: data.phone || undefined,
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
    <div className="space-y-4">
      {/* Google Sign-up Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-dark transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        {googleLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-gray-400 border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {t("signUpWithGoogle")}
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
          type="text"
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
          htmlFor="phone"
          className="mb-1.5 block text-sm font-medium text-dark dark:text-white"
        >
          {t("phoneLabel")}
        </label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={data.phone}
          onChange={handleChange}
          placeholder={t("phonePlaceholder")}
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

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium text-dark dark:text-white"
        >
          {t("confirmPasswordLabel")}
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          value={data.confirmPassword}
          onChange={handleChange}
          placeholder={t("confirmPasswordPlaceholder")}
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
              {t("creatingAccount")}
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
        {t("haveAccountQuestion")}{" "}
        <Link
          href="/auth/sign-in"
          className="font-bold text-[#10b981] hover:underline"
        >
          {t("signInLinkText")}
        </Link>
      </p>
    </form>
    </div>
  );
}
