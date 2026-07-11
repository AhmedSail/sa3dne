"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
};

export default function EditUserForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    role: user.role ?? "user",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let failed = false;

    // Update name, phone, and role via custom API route
    if (
      form.name !== user.name ||
      form.phone !== (user.phone ?? "") ||
      form.role !== user.role
    ) {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone || null,
            role: form.role,
          }),
        });
        if (!res.ok) failed = true;
      } catch (err) {
        failed = true;
      }
    }

    setSaving(false);

    if (failed) {
      toast.error("فشل في تحديث بيانات المستخدم");
      return;
    }

    toast.success("تم تحديث بيانات المستخدم بنجاح");
    router.push("/dashboard/users");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          تعديل المستخدم
        </h1>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          تعديل بيانات المستخدم
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              الاسم الكامل
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              رقم الهاتف (اختياري)
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+966501234567"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              الدور
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <option value="user">مستخدم عادي</option>
              <option value="admin">مشرف النظام (System Admin)</option>
              <option value="camp_manager">مدير مخيم (Camp Manager)</option>
              <option value="org_representative">ممثل منظمة (Org Representative)</option>
              <option value="independent_initiator">مبادر مساعدات مستقل (Independent Initiator)</option>
              <option value="beneficiary">مستفيد (Beneficiary)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <Link
              href="/dashboard/users"
              className="flex-1 rounded-lg border border-stroke px-5 py-2.5 text-center text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
