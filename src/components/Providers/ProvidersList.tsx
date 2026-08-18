"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import Link from "next/link";
import { ContributionStatusBadge } from "@/components/Contributions/status-badges";

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

type ContributionRow = {
  id: string;
  status: string;
  displayStatus?: string;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  camps?: { id: string; name: string }[];
};

type SelectUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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
  const [showForm, setShowForm] = useState(false);
  const [selectedProviderForHistory, setSelectedProviderForHistory] = useState<Provider | null>(null);
  const [history, setHistory] = useState<ContributionRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "organization" as "organization" | "independent_initiator",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    notes: "",
    linkedUserId: "",
  });

  // The contribution history is loaded on demand: the directory itself has no
  // reason to carry every provider's contributions, and the server re-checks
  // the caller's permission on each request.
  useEffect(() => {
    const provider = selectedProviderForHistory;
    if (!provider) return;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    setHistory([]);

    fetch(`/api/contributions?providerId=${encodeURIComponent(provider.id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as ContributionRow[];
      })
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch(() => {
        if (!cancelled) setHistoryError(t("errFetchFailed"));
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProviderForHistory, t]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (prov: Provider) => {
    setEditingId(prov.id);
    setShowForm(true);
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
    setShowForm(false);
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
      toast.error(language === "ar" ? "اسم المنظمة أو المبادرة مطلوب" : "Name of organization/initiative is required");
      return;
    }

    if (!form.phone?.trim() && !form.email?.trim()) {
      toast.error(language === "ar" ? "يجب إدخال رقم هاتف أو بريد إلكتروني للتواصل" : "Contact phone or email is required");
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
      <div className="flex items-start justify-between gap-4">
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
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
          >
            {language === "ar" ? "+ إضافة جهة جديدة" : "+ Add Provider"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* List Column */}
        <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
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
      </div>

      {/* Add/Edit Form Modal */}
      {isAdmin && showForm && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelEdit(); }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-gray-dark border border-stroke dark:border-dark-3 space-y-4">
            <div className="flex items-center justify-between border-b border-stroke pb-2 dark:border-dark-3">
              <h2 className="text-base font-bold text-dark dark:text-white">
              {editingId ? t("editProvider") : t("addProvider")}
              </h2>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-2 dark:hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

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

              <div className="grid grid-cols-2 gap-4">
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
        </div>
      , document.body)}

      {/* Contribution History Modal */}
      {selectedProviderForHistory && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProviderForHistory(null); }}
        >
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark border border-stroke dark:border-dark-3 space-y-4">
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

            {historyLoading && (
              <p className="py-6 text-center text-sm text-dark-4 dark:text-dark-6">
                {t("loading")}
              </p>
            )}

            {!historyLoading && historyError && (
              <p className="py-6 text-center text-sm text-red-500">{historyError}</p>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <p className="py-6 text-center text-sm text-dark-4 dark:text-dark-6">
                {t("noContributions")}
              </p>
            )}

            {!historyLoading && !historyError && history.length > 0 && (
              <div className="max-h-[55vh] overflow-auto rounded-lg border border-stroke dark:border-dark-3">
                <table className="w-full text-start text-sm">
                  <thead className="sticky top-0 bg-gray-2 dark:bg-dark-2">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase text-dark-4 dark:text-dark-6">
                        {t("submittedAt")}
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase text-dark-4 dark:text-dark-6">
                        {t("camps")}
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase text-dark-4 dark:text-dark-6">
                        {t("status")}
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase text-dark-4 dark:text-dark-6">
                        {t("notes")}
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    {history.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                          {formatDate(row.submittedAt ?? row.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                          {row.camps?.length
                            ? row.camps.map((c) => c.name).join("، ")
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <ContributionStatusBadge
                            status={row.displayStatus ?? row.status}
                          />
                        </td>
                        <td className="max-w-[16rem] truncate px-4 py-3 text-dark-4 dark:text-dark-6">
                          {row.notes || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-end">
                          <Link
                            href={`/dashboard/contributions/${row.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {t("details")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
      , document.body)}
    </div>
  );
}
