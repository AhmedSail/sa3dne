"use client";

import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean | null | undefined;
  phone?: string | null;
  createdAt: Date;
};

export default function UsersList({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleBanToggle(user: User) {
    setLoadingId(user.id);
    if (!user.banned) {
      const activeAdmins = initialUsers.filter(
        (u) => u.role === "admin" && !u.banned && u.id !== user.id,
      );
      if (user.role === "admin" && activeAdmins.length === 0) {
        toast.error("لا يمكن حظر آخر مشرف نشط في النظام");
        setLoadingId(null);
        return;
      }
      if (user.id === currentUserId) {
        toast.error("لا يمكنك حظر حسابك الشخصي");
        setLoadingId(null);
        return;
      }
      const { error } = await authClient.admin.banUser({ userId: user.id });
      if (error) toast.error("فشل في حظر المستخدم");
      else toast.success("تم حظر المستخدم بنجاح");
    } else {
      const { error } = await authClient.admin.unbanUser({ userId: user.id });
      if (error) toast.error("فشل في رفع الحظر عن المستخدم");
      else toast.success("تم رفع الحظر عن المستخدم");
    }
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            إدارة المستخدمين
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            إنشاء وتعديل وإدارة حسابات المستخدمين
          </p>
        </div>
        <Link
          href="/dashboard/users/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90"
        >
          <span className="text-lg leading-none">+</span>
          إضافة مستخدم
        </Link>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                {["الاسم", "البريد الإلكتروني", "رقم الهاتف", "الدور", "الحالة", "الإجراءات"].map(
                  (col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-dark-4 dark:text-dark-6"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {initialUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    لا يوجد مستخدمون بعد
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                  >
                    {/* Name */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {user.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-dark dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="text-dark-4 dark:text-dark-6">
                        {user.email}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {user.phone ?? (
                        <span className="text-dark-6 dark:text-dark-4">—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-2 text-dark-4 dark:bg-dark-2 dark:text-dark-6"
                        }`}
                      >
                        {user.role === "admin" ? "مشرف" : "مستخدم"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.banned
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${user.banned ? "bg-red-500" : "bg-green-500"}`}
                        />
                        {user.banned ? "محظور" : "نشط"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          تعديل
                        </Link>
                        <button
                          onClick={() => handleBanToggle(user)}
                          disabled={loadingId === user.id}
                          className={`text-xs font-medium disabled:opacity-40 ${
                            user.banned
                              ? "text-green-600 hover:underline dark:text-green-400"
                              : "text-red-500 hover:underline dark:text-red-400"
                          }`}
                        >
                          {loadingId === user.id
                            ? "..."
                            : user.banned
                              ? "رفع الحظر"
                              : "حظر"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {initialUsers.length > 0 && (
          <div className="border-t border-stroke px-4 py-3 dark:border-dark-3">
            <p className="text-xs text-dark-4 dark:text-dark-6">
              إجمالي المستخدمين:{" "}
              <span className="font-semibold text-dark dark:text-white">
                {initialUsers.length}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
