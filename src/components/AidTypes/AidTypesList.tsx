"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type AidType = {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  status: string;
};

export default function AidTypesList({
  initialTypes,
  isAdmin,
}: {
  initialTypes: AidType[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [types, setTypes] = useState<AidType[]>(initialTypes);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "food",
    defaultUnit: "kg",
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "food":
        return t("categoryFood");
      case "medical":
        return t("categoryMedical");
      case "shelter":
        return t("categoryShelter");
      case "water":
        return t("categoryWater");
      default:
        return t("categoryOther");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (type: AidType) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      category: type.category,
      defaultUnit: type.defaultUnit,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", category: "food", defaultUnit: "kg" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(t("fieldRequired"));
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/aid-types/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (res.ok) {
          toast.success(t("success"));
          setTypes((prev) =>
            prev.map((t) => (t.id === editingId ? { ...t, ...form } : t)),
          );
          handleCancelEdit();
          router.refresh();
        } else {
          const err = await res.json();
          toast.error(err.error || t("error"));
        }
      } else {
        // Create
        const res = await fetch("/api/aid-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (res.ok) {
          toast.success(t("success"));
          const newType = await res.json();
          setTypes((prev) => [...prev, newType]);
          setForm({ name: "", category: "food", defaultUnit: "kg" });
          router.refresh();
        } else {
          const err = await res.json();
          toast.error(err.error || t("error"));
        }
      }
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من تعطيل هذا النوع؟" : "Are you sure you want to deactivate this aid type?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/aid-types/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("success"));
        setTypes((prev) => prev.filter((t) => t.id !== id));
        router.refresh();
      } else {
        toast.error(t("error"));
      }
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("aidTypesList")}
        </h1>
        <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
          {language === "ar"
            ? "تعريف وإدارة فئات ووحدات قياس المساعدات الإنسانية"
            : "Define and manage categories and measurement units of humanitarian aid"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List Column */}
        <div className="lg:col-span-2 rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto text-sm text-right">
              <thead>
                <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("aidTypeName")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("aidTypeCategory")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("defaultUnit")}
                  </th>
                  {isAdmin && (
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                      {t("actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {types.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 4 : 3}
                      className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                    >
                      {language === "ar" ? "لا يوجد أنواع مساعدات مسجلة بعد" : "No aid types registered yet"}
                    </td>
                  </tr>
                ) : (
                  types.map((item) => (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-dark dark:text-white">
                        {item.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {getCategoryLabel(item.category)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                        {item.defaultUnit}
                      </td>
                      {isAdmin && (
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => handleDeactivate(item.id)}
                              className="text-xs font-medium text-red-500 hover:underline"
                            >
                              {t("deactivate")}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form Column */}
        {isAdmin && (
          <div className="lg:col-span-1 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark h-fit">
            <h2 className="mb-4 text-base font-bold text-dark border-b border-stroke pb-2 dark:text-white dark:border-dark-3">
              {editingId ? t("editAidType") : t("addAidType")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("aidTypeName")} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder={language === "ar" ? "مثال: طحين قمح" : "e.g. Wheat Flour"}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("aidTypeCategory")}
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value="food">{t("categoryFood")}</option>
                  <option value="medical">{t("categoryMedical")}</option>
                  <option value="shelter">{t("categoryShelter")}</option>
                  <option value="water">{t("categoryWater")}</option>
                  <option value="other">{t("categoryOther")}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("defaultUnit")} *
                </label>
                <input
                  type="text"
                  name="defaultUnit"
                  required
                  value={form.defaultUnit}
                  onChange={handleInputChange}
                  placeholder={language === "ar" ? "كجم، لتر، طرد..." : "kg, liter, box..."}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-opacity-90 disabled:opacity-70"
                >
                  {loading ? t("loading") : t("save")}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 rounded-lg border border-stroke px-4 py-2 text-xs font-semibold text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                  >
                    {t("cancel")}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
