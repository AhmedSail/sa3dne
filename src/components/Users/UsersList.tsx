"use client";

import { banUserAction, unbanUserAction } from "@/lib/actions/users";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import ExportButtons from "../ExportButtons";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const ITEMS_PER_PAGE = 10;
  
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(q);
        
      const matchesRole = filterRole === "all" || user.role === filterRole;
      
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && !user.banned) ||
        (filterStatus === "banned" && user.banned);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [initialUsers, searchQuery, filterRole, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
      const result = await banUserAction(user.id);
      if (result.error) toast.error(result.error);
      else toast.success("تم حظر المستخدم بنجاح");
    } else {
      const result = await unbanUserAction(user.id);
      if (result.error) toast.error(result.error);
      else toast.success("تم رفع الحظر عن المستخدم");
    }
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            إدارة المستخدمين
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            إنشاء وتعديل وإدارة حسابات المستخدمين
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButtons 
            data={filteredUsers}
            filename="قائمة_المستخدمين"
            columns={[
              { key: "name", label: "الاسم" },
              { key: "email", label: "البريد الإلكتروني" },
              { key: "phone", label: "رقم الهاتف" },
              { key: "role", label: "الدور" },
              { key: "banned", label: "محظور" }
            ]}
          />
          <Link
            href="/dashboard/users/new"
            className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 print:hidden"
          >
            <span className="text-lg leading-none">+</span>
            إضافة مستخدم
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3 print:hidden">
        <div className="relative">
          <input
            type="text"
            placeholder="البحث بالاسم، الإيميل، رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
        </div>
        <div>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="all">كل الأدوار</option>
            <option value="admin">مشرف النظام</option>
            <option value="camp_manager">مدير مخيم</option>
            <option value="org_representative">ممثل منظمة</option>
            <option value="independent_initiator">مبادر مستقل</option>
            <option value="beneficiary">مستفيد</option>
            <option value="user">مستخدم عادي</option>
          </select>
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="banned">محظور</option>
          </select>
        </div>
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
              {currentUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    لا يوجد مستخدمون بعد
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
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
                      {(() => {
                        const getRoleDetails = (role: string) => {
                          switch (role) {
                            case "admin":
                              return { label: "مشرف النظام", class: "bg-primary/10 text-primary" };
                            case "camp_manager":
                              return { label: "مدير مخيم", class: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" };
                            case "org_representative":
                              return { label: "ممثل منظمة", class: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" };
                            case "independent_initiator":
                              return { label: "مبادر مستقل", class: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" };
                            case "beneficiary":
                              return { label: "مستفيد", class: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" };
                            default:
                              return { label: "مستخدم عادي", class: "bg-gray-2 text-dark-4 dark:bg-dark-2 dark:text-dark-6" };
                          }
                        };
                        const roleDetails = getRoleDetails(user.role);
                        return (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleDetails.class}`}
                          >
                            {roleDetails.label}
                          </span>
                        );
                      })()}
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

        {/* Footer count & Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-stroke px-4 py-3 dark:border-dark-3 gap-4">
            <p className="text-xs text-dark-4 dark:text-dark-6">
              إجمالي المستخدمين:{" "}
              <span className="font-semibold text-dark dark:text-white">
                {filteredUsers.length}
              </span>
            </p>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded px-2 py-1 text-xs font-medium bg-gray-2 text-dark-4 disabled:opacity-50 dark:bg-dark-2 dark:text-dark-6 transition hover:bg-gray-3 dark:hover:bg-dark-3"
                >
                  السابق
                </button>
                <span className="text-xs font-medium text-dark-4 dark:text-dark-6">
                  {currentPage} من {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded px-2 py-1 text-xs font-medium bg-gray-2 text-dark-4 disabled:opacity-50 dark:bg-dark-2 dark:text-dark-6 transition hover:bg-gray-3 dark:hover:bg-dark-3"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
