"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

type Provider = {
  id: string;
  type: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  linkedUserId: string | null;
  status: string;
};

type SelectUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function ProvidersList({
  initialProviders,
  users,
  isAdmin,
}: {
  initialProviders: Provider[];
  users: SelectUser[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProviderForHistory, setSelectedProviderForHistory] = useState<Provider | null>(null);

  const [form, setForm] = useState({
    type: "organization" as "organization" | "independent_initiator",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    notes: "",
    linkedUserId: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (prov: Provider) => {
    setEditingId(prov.id);
    setForm({
      type: prov.type as "organization" | "independent_initiator",
      name: prov.name,
      contactPerson: prov.contactPerson ?? "",
      phone: prov.phone ?? "",
      email: prov.email ?? "",
      notes: prov.notes ?? "",
      linkedUserId: prov.linkedUserId ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      type: "organization",
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      notes: "",
      linkedUserId: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(t("fieldRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: form.type,
        name: form.name,
        contactPerson: form.contactPerson || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
        linkedUserId: form.linkedUserId || null,
      };

      if (editingId) {
        // Update
        const res = await fetch(`/api/providers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success(t("success"));
          setProviders((prev) =>
            prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)),
          );
          handleCancelEdit();
          router.refresh();
        } else {
          const err = await res.json();
          toast.error(err.error || t("error"));
        }
      } else {
        // Create
        const res = await fetch("/api/providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success(t("success"));
          const newProvider = await res.json();
          setProviders((prev) => [...prev, newProvider]);
          handleCancelEdit();
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
    if (!confirm(language === "ar" ? "هل أنت متأكد من تعطيل هذا المزود؟" : "Are you sure you want to deactivate this provider?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("success"));
        setProviders((prev) => prev.filter((p) => p.id !== id));
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

  // Filter users based on provider type to enforce compatible linking
  const filteredUsers = users.filter((u) => {
    if (form.type === "organization") {
      return u.role === "org_representative";
    } else {
      return u.role === "independent_initiator";
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("providersList")}
        </h1>
        <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
          {language === "ar"
            ? "تسجيل جهات المساعدات المعتمدة وربط حسابات المنظمات والمبادرين"
            : "Register approved aid providers and link organization and initiator accounts"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List Column */}
        <div className="lg:col-span-2 rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto text-sm text-right">
              <thead>
                <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("providerName")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("providerType")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("contactPerson")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("linkedUser")}
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-dark-3">
                {providers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                    >
                      {language === "ar" ? "لا يوجد جهات مانحة مسجلة بعد" : "No registered donors/providers yet"}
                    </td>
                  </tr>
                ) : (
                  providers.map((item) => {
                    const linkedAcc = users.find((u) => u.id === item.linkedUserId);
                    return (
                      <tr
                        key={item.id}
                        className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-primary hover:underline">
                          <Link href={`/dashboard/providers/${item.id}`}>
                            {item.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                          {item.type === "organization" ? t("providerTypeOrg") : t("providerTypeIndie")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                          {item.contactPerson ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                          {linkedAcc ? `${linkedAcc.name} (${linkedAcc.email})` : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedProviderForHistory(item)}
                              className="text-xs font-medium text-dark-4 hover:text-primary hover:underline dark:text-dark-6"
                            >
                              {t("contributionHistory")}
                            </button>
                            {isAdmin && (
                              <>
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form Column */}
        {isAdmin && (
          <div className="lg:col-span-1 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark h-fit space-y-4">
            <h2 className="text-base font-bold text-dark border-b border-stroke pb-2 dark:text-white dark:border-dark-3">
              {editingId ? t("editProvider") : t("addProvider")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("providerType")}
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Reset linkedUserId to prevent invalid assignments
                    setForm((prev) => ({ ...prev, linkedUserId: "" }));
                  }}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value="organization">{t("providerTypeOrg")}</option>
                  <option value="independent_initiator">{t("providerTypeIndie")}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("providerName")} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder={language === "ar" ? "اسم المنظمة أو المبادرة" : "Name of organization/initiative"}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("contactPerson")}
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="+966..."
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {language === "ar" ? "البريد الإلكتروني للتواصل" : "Contact Email"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="contact@domain.com"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("linkedUser")}
                </label>
                <select
                  name="linkedUserId"
                  value={form.linkedUserId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  <option value="">{t("selectUserPlaceholder")}</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("notes")}
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleInputChange}
                  rows={2}
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

      {/* Contribution History Modal (Placeholder) */}
      {selectedProviderForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark border border-stroke dark:border-dark-3 space-y-4">
            <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-dark-3">
              <h3 className="text-lg font-bold text-dark dark:text-white">
                {t("contributionHistory")} - {selectedProviderForHistory.name}
              </h3>
              <button
                onClick={() => setSelectedProviderForHistory(null)}
                className="text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-dark-4 dark:text-dark-6 leading-relaxed">
              {t("placeholderHistoryText")}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProviderForHistory(null)}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
