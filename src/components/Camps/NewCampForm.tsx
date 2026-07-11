"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

type Manager = {
  id: string;
  name: string;
  email: string;
};

export default function NewCampForm({ managers }: { managers: Manager[] }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "gaza_city" as "north_gaza" | "gaza_city" | "middle_area" | "khan_yunis" | "rafah",
    capacity: 100,
    needLevel: "low" as "low" | "medium" | "high" | "critical",
    operationalStatus: "active" as "active" | "inactive" | "closed",
    notes: "",
    assignedManagers: [] as string[], // array of userIds
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleManagerCheckbox = (userId: string, checked: boolean) => {
    setForm((prev) => {
      const selected = checked
        ? [...prev.assignedManagers, userId]
        : prev.assignedManagers.filter((id) => id !== userId);
      return { ...prev, assignedManagers: selected };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.capacity <= 0) {
      toast.error(t("capacityValidationError"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/camps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          capacity: form.capacity,
          needLevel: form.needLevel,
          operationalStatus: form.operationalStatus,
          notes: form.notes || null,
        }),
      });

      if (res.ok) {
        const createdCamp = await res.json();

        // Assign managers if selected
        if (form.assignedManagers.length > 0) {
          await fetch(`/api/camps/${createdCamp.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignedManagers: form.assignedManagers,
            }),
          });
        }

        toast.success(t("success"));
        router.push("/dashboard/camps");
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || t("error"));
      }
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("addCamp")}
        </h1>
      </div>

      <div className="max-w-2xl rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("campName")} *
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder={language === "ar" ? "مثال: مخيم الأمل" : "e.g. Hope Camp"}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("campLocation")} *
              </label>
              <select
                name="location"
                required
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="north_gaza">{t("north_gaza")}</option>
                <option value="gaza_city">{t("gaza_city")}</option>
                <option value="middle_area">{t("middle_area")}</option>
                <option value="khan_yunis">{t("khan_yunis")}</option>
                <option value="rafah">{t("rafah")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("campCapacity")} *
              </label>
              <input
                type="number"
                name="capacity"
                required
                min={1}
                value={form.capacity}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("campNeedLevel")}
              </label>
              <select
                name="needLevel"
                value={form.needLevel}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="low">{t("needLevelLow")}</option>
                <option value="medium">{t("needLevelMedium")}</option>
                <option value="high">{t("needLevelHigh")}</option>
                <option value="critical">{t("needLevelCritical")}</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("campOperationalStatus")}
              </label>
              <select
                name="operationalStatus"
                value={form.operationalStatus}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
                <option value="closed">{t("closed")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              {t("notes")}
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Assigned Managers */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              {t("assignManager")}
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-stroke p-3 space-y-2 dark:border-dark-3 dark:bg-dark-2">
              {managers.length === 0 ? (
                <p className="text-xs text-dark-4 dark:text-dark-6">
                  {language === "ar" ? "لا يوجد مدراء مخيمات مسجلين في النظام" : "No registered camp managers found"}
                </p>
              ) : (
                managers.map((m) => (
                  <label key={m.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.assignedManagers.includes(m.id)}
                      onChange={(e) => handleManagerCheckbox(m.id, e.target.checked)}
                      className="rounded border-stroke text-primary outline-none focus:border-primary"
                    />
                    <span className="text-dark dark:text-white">{m.name}</span>
                    <span className="text-xs text-dark-4 dark:text-dark-6">({m.email})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {loading ? t("loading") : t("save")}
            </button>
            <Link
              href="/dashboard/camps"
              className="flex-1 rounded-lg border border-stroke px-5 py-2.5 text-center text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              {t("cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
