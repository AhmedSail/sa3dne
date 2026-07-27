"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/language-context";
import { useSession } from "@/lib/auth/auth-client";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [name, setName] = useState("");
  const [loadingName, setLoadingName] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isAr ? "الاسم مطلوب" : "Name is required");
      return;
    }
    setLoadingName(true);
    try {
      await authClient.updateUser({ name });
      toast.success(isAr ? "تم تحديث الاسم بنجاح" : "Name updated successfully");
    } catch {
      toast.error(isAr ? "فشل تحديث الاسم" : "Failed to update name");
    } finally {
      setLoadingName(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isAr ? "كلمتا السر غير متطابقتين" : "Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error(isAr ? "كلمة السر يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    setLoadingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      toast.success(isAr ? "تم تغيير كلمة السر بنجاح" : "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error(isAr ? "فشل تغيير كلمة السر. تأكد من كلمة السر الحالية" : "Failed to change password. Check your current password");
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {isAr ? "الملف الشخصي" : "Profile"}
        </h1>
        <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
          {isAr ? "إدارة معلوماتك الشخصية" : "Manage your personal information"}
        </p>
      </div>

      {/* Name Section */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
          {isAr ? "معلومات عامة" : "General Information"}
        </h2>
        <form onSubmit={handleNameUpdate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {isAr ? "الاسم الكامل" : "Full Name"} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark-4 dark:text-dark-6">
              {isAr ? "رقم الهوية / البريد الإلكتروني" : "ID Number / Email"}
            </label>
            <input
              type="text"
              value={session?.user?.email?.replace("@sa3dne.local", "") || ""}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 text-sm text-dark-4 outline-none cursor-not-allowed dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingName}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {loadingName ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
          {isAr ? "تغيير كلمة السر" : "Change Password"}
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {isAr ? "كلمة السر الحالية" : "Current Password"} *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {isAr ? "كلمة السر الجديدة" : "New Password"} *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {isAr ? "تأكيد كلمة السر الجديدة" : "Confirm New Password"} *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingPassword}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {loadingPassword ? (isAr ? "جاري التغيير..." : "Changing...") : (isAr ? "تغيير كلمة السر" : "Change Password")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
