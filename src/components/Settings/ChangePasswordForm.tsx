"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { useState } from "react";
import { toast } from "sonner";

export default function ChangePasswordForm() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error(t("passwordMismatchError"));
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error(t("passwordMinLengthError"));
      return;
    }

    setLoading(true);

    const { error } = await authClient.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
      revokeOtherSessions: true,
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message?.includes("incorrect")
          ? t("currentPasswordIncorrect")
          : t("changePasswordFailed"),
      );
      return;
    }

    toast.success(t("passwordChanged"));
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("changePassword")}
        </h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          {t("changePasswordSubtitle")}
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("currentPasswordLabel")}
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("newPasswordLabel")}
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              value={form.newPassword}
              onChange={handleChange}
              placeholder={t("passwordMinLengthPlaceholder")}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("confirmNewPasswordLabel")}
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {loading ? t("changing") : t("changePassword")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
