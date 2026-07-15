"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ContributionStatusBadge, LineStatusBadge } from "./status-badges";

type Line = {
  id: string;
  campId: string;
  campName: string;
  aidTypeId: string;
  aidTypeName: string;
  plannedQuantity: number;
  unit: string;
  plannedDeliveryDate: string | Date | null;
  status: string;
  actualReceivedQuantity: number | null;
  actualReceiptDate: string | Date | null;
  confirmationNotes: string | null;
  rejectionReason: string | null;
};

type Contribution = {
  id: string;
  status: string;
  notes: string | null;
  submittedAt: string | Date | null;
  createdAt: string | Date | null;
  providerName: string | null;
};

type CampOption = { id: string; name: string };
type AidTypeOption = { id: string; name: string; defaultUnit: string };

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function ContributionDetail({
  contribution,
  lines: initialLines,
  camps,
  aidTypes,
  canEdit,
}: {
  contribution: Contribution;
  lines: Line[];
  camps: CampOption[];
  aidTypes: AidTypeOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [loading, setLoading] = useState(false);
  const [lineForm, setLineForm] = useState({
    campId: "",
    aidTypeId: "",
    plannedQuantity: "",
    unit: "",
    plannedDeliveryDate: "",
  });

  const isAr = language === "ar";

  const handleAidTypeChange = (aidTypeId: string) => {
    const at = aidTypes.find((a) => a.id === aidTypeId);
    setLineForm((prev) => ({
      ...prev,
      aidTypeId,
      unit: prev.unit || (at?.defaultUnit ?? ""),
    }));
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(lineForm.plannedQuantity);
    if (!lineForm.campId || !lineForm.aidTypeId || !lineForm.unit.trim()) {
      toast.error(t("fieldRequired"));
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error(t("quantityValidationError"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/contributions/${contribution.id}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: lineForm.campId,
          aidTypeId: lineForm.aidTypeId,
          plannedQuantity: qty,
          unit: lineForm.unit,
          plannedDeliveryDate: lineForm.plannedDeliveryDate || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setLines((prev) => [
          ...prev,
          {
            id: created.id,
            campId: created.campId,
            campName: created.campName,
            aidTypeId: created.aidTypeId,
            aidTypeName: created.aidTypeName,
            plannedQuantity: created.plannedQuantity,
            unit: created.unit,
            plannedDeliveryDate: created.plannedDeliveryDate,
            status: created.status,
            actualReceivedQuantity: null,
            actualReceiptDate: null,
            confirmationNotes: null,
            rejectionReason: null,
          },
        ]);
        setLineForm({
          campId: "",
          aidTypeId: "",
          plannedQuantity: "",
          unit: "",
          plannedDeliveryDate: "",
        });
        toast.success(t("success"));
      } else {
        const err = await res.json();
        toast.error(err.error || t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLine = async (lineId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contributions/${contribution.id}/lines/${lineId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setLines((prev) => prev.filter((l) => l.id !== lineId));
        toast.success(t("success"));
      } else {
        toast.error(t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (lines.length === 0) {
      toast.error(t("noLinesYet"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contributions/${contribution.id}/submit`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(t("success"));
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!confirm(isAr ? "هل تريد حذف هذه المسودة؟" : "Delete this draft?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contributions/${contribution.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t("success"));
        router.push("/dashboard/contributions");
      } else {
        toast.error(t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {t("contributionDetails")}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {contribution.providerName ?? "—"}
          </p>
        </div>
        <Link
          href="/dashboard/contributions"
          className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>

      {/* Header card */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark sm:grid-cols-3">
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("status")}</p>
          <div className="mt-1">
            <ContributionStatusBadge status={contribution.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("submittedAt")}</p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {formatDate(contribution.submittedAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("notes")}</p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {contribution.notes || "—"}
          </p>
        </div>
      </div>

      {/* Lines */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
        <div className="border-b border-stroke px-5 py-3.5 dark:border-dark-3">
          <h2 className="text-base font-bold text-dark dark:text-white">
            {t("contributionLines")}
          </h2>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm text-right">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("camps")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("aidType")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("plannedQuantity")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("receivedQuantity")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                  {t("status")}
                </th>
                {canEdit && (
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-dark-4 dark:text-dark-6">
                    {t("actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 6 : 5}
                    className="px-4 py-10 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    {t("noLinesYet")}
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-1 dark:hover:bg-dark-2">
                    <td className="whitespace-nowrap px-4 py-3 text-dark dark:text-white">
                      {l.campName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {l.aidTypeName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {l.plannedQuantity} {l.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-dark-4 dark:text-dark-6">
                      {l.actualReceivedQuantity ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <LineStatusBadge status={l.status} />
                    </td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          onClick={() => handleRemoveLine(l.id)}
                          disabled={loading}
                          className="text-xs font-medium text-red-500 hover:underline disabled:opacity-60"
                        >
                          {t("removeLine")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add line form + submit (draft only) */}
      {canEdit && (
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark space-y-4">
          <h3 className="text-base font-bold text-dark dark:text-white">
            {t("addLine")}
          </h3>
          <form
            onSubmit={handleAddLine}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                {t("camps")} *
              </label>
              <select
                value={lineForm.campId}
                onChange={(e) =>
                  setLineForm((p) => ({ ...p, campId: e.target.value }))
                }
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="">{t("selectCampPlaceholder")}</option>
                {camps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                {t("aidType")} *
              </label>
              <select
                value={lineForm.aidTypeId}
                onChange={(e) => handleAidTypeChange(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                <option value="">{t("selectAidTypePlaceholder")}</option>
                {aidTypes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                {t("plannedQuantity")} *
              </label>
              <input
                type="number"
                min={1}
                value={lineForm.plannedQuantity}
                onChange={(e) =>
                  setLineForm((p) => ({ ...p, plannedQuantity: e.target.value }))
                }
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                {t("unit")} *
              </label>
              <input
                type="text"
                value={lineForm.unit}
                onChange={(e) =>
                  setLineForm((p) => ({ ...p, unit: e.target.value }))
                }
                placeholder={isAr ? "صندوق، لتر، كجم" : "box, litre, kg"}
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                {t("plannedDeliveryDate")}
              </label>
              <input
                type="date"
                value={lineForm.plannedDeliveryDate}
                onChange={(e) =>
                  setLineForm((p) => ({ ...p, plannedDeliveryDate: e.target.value }))
                }
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-60"
              >
                {t("addLine")}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 border-t border-stroke pt-4 dark:border-dark-3">
            <button
              onClick={handleSubmit}
              disabled={loading || lines.length === 0}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-60"
            >
              {t("submitContribution")}
            </button>
            <button
              onClick={handleDeleteDraft}
              disabled={loading}
              className="rounded-lg border border-red-500 px-5 py-2 text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-60"
            >
              {t("deleteDraft")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
