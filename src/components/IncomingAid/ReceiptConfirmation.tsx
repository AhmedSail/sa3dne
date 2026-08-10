"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { LineStatusBadge } from "@/components/Contributions/status-badges";
import { allowedActionsFor, type ConfirmInput } from "@/lib/contributions/receipt";

type LineDetail = {
  id: string;
  campName: string;
  aidTypeName: string;
  providerName: string;
  plannedQuantity: number;
  unit: string;
  plannedDeliveryDate: string | Date | null;
  status: string;
  actualReceivedQuantity: number | null;
  actualReceiptDate: string | Date | null;
  confirmationNotes: string | null;
  rejectionReason: string | null;
  submittedAt: string | Date | null;
};

type Action = ConfirmInput["action"];

const ACTION_LABEL_KEY: Record<Action, string> = {
  full: "confirmFull",
  partial: "confirmPartial",
  complete: "completeReceipt",
  not_received: "markNotReceived",
  reject: "rejectLine",
};

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function ReceiptConfirmation({ line }: { line: LineDetail }) {
  const router = useRouter();
  const { t } = useLanguage();

  // The set of actions is decided by the same rule the server enforces, so the
  // UI can never offer something the API would reject.
  const actions = allowedActionsFor(line.status);
  const isSettled = actions.length === 0;
  const remainingQuantity = Math.max(
    line.plannedQuantity - (line.actualReceivedQuantity ?? 0),
    0,
  );

  const [action, setAction] = useState<Action>(actions[0] ?? "full");
  const [loading, setLoading] = useState(false);
  const [receiptDate, setReceiptDate] = useState("");
  const [receivedQty, setReceivedQty] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const submit = async () => {
    let payload: Record<string, unknown> = { action };

    if (action === "full") {
      if (!receiptDate) return toast.error(t("fieldRequired"));
      payload = { action, actualReceiptDate: receiptDate };
    } else if (action === "partial") {
      const qty = Number(receivedQty);
      if (!Number.isInteger(qty) || qty <= 0)
        return toast.error(t("quantityValidationError"));
      if (qty >= line.plannedQuantity)
        return toast.error(t("partialQuantityValidationError"));
      if (!receiptDate) return toast.error(t("fieldRequired"));
      if (!notes.trim()) return toast.error(t("fieldRequired"));
      payload = {
        action,
        actualReceivedQuantity: qty,
        actualReceiptDate: receiptDate,
        confirmationNotes: notes,
      };
    } else if (action === "complete") {
      if (!receiptDate) return toast.error(t("fieldRequired"));
      payload = {
        action,
        actualReceiptDate: receiptDate,
        confirmationNotes: notes.trim() || null,
      };
    } else if (action === "not_received") {
      if (!notes.trim()) return toast.error(t("fieldRequired"));
      payload = { action, confirmationNotes: notes };
    } else if (action === "reject") {
      if (!rejectionReason.trim()) return toast.error(t("fieldRequired"));
      payload = { action, rejectionReason };
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/incoming-aid/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("success"));
        router.push("/dashboard/incoming-aid");
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {isSettled
              ? t("receiptDetails")
              : action === "complete"
                ? t("completeReceipt")
                : t("confirmReceipt")}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {line.campName} · {line.aidTypeName}
          </p>
        </div>
        <Link
          href="/dashboard/incoming-aid"
          className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>

      {/* Line summary */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark sm:grid-cols-3">
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("provider")}</p>
          <p className="mt-1 text-sm text-dark dark:text-white">{line.providerName}</p>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">
            {t("plannedQuantity")}
          </p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {line.plannedQuantity} {line.unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">
            {t("plannedDeliveryDate")}
          </p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {formatDate(line.plannedDeliveryDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("status")}</p>
          <div className="mt-1">
            <LineStatusBadge status={line.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-dark-4 dark:text-dark-6">{t("submittedAt")}</p>
          <p className="mt-1 text-sm text-dark dark:text-white">
            {formatDate(line.submittedAt)}
          </p>
        </div>
        {line.actualReceivedQuantity !== null && (
          <div>
            <p className="text-xs text-dark-4 dark:text-dark-6">
              {t("receivedQuantity")}
            </p>
            <p className="mt-1 text-sm text-dark dark:text-white">
              {line.actualReceivedQuantity} {line.unit}
            </p>
          </div>
        )}
      </div>

      {isSettled ? (
        /* Terminal statuses ("received" / "rejected") are read-only. */
        <div className="space-y-4 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="text-base font-bold text-dark dark:text-white">
            {t("receiptOutcome")}
          </h2>
          <p className="text-sm text-dark-4 dark:text-dark-6">
            {t("lineSettledNoActions")}
          </p>
          <div className="grid grid-cols-1 gap-4 border-t border-stroke pt-4 dark:border-dark-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-dark-4 dark:text-dark-6">
                {t("receiptDate")}
              </p>
              <p className="mt-1 text-sm text-dark dark:text-white">
                {formatDate(line.actualReceiptDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-dark-4 dark:text-dark-6">
                {t("confirmationNotes")}
              </p>
              <p className="mt-1 text-sm text-dark dark:text-white">
                {line.confirmationNotes || "—"}
              </p>
            </div>
            {line.rejectionReason && (
              <div className="sm:col-span-2">
                <p className="text-xs text-dark-4 dark:text-dark-6">
                  {t("rejectionReason")}
                </p>
                <p className="mt-1 text-sm text-dark dark:text-white">
                  {line.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Action form */
        <div className="space-y-4 rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="text-base font-bold text-dark dark:text-white">
            {t("receiptAction")}
          </h2>

          {/* A single available action needs no tab strip. */}
          {actions.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((key) => (
                <button
                  key={key}
                  onClick={() => setAction(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    action === key
                      ? "bg-primary text-white"
                      : "border border-stroke text-dark-4 hover:bg-gray-2 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
                  }`}
                >
                  {t(ACTION_LABEL_KEY[key] as any)}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4 border-t border-stroke pt-4 dark:border-dark-3">
            {action === "full" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("receiptDate")} *
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
                <p className="mt-1.5 text-xs text-dark-4 dark:text-dark-6">
                  {t("fullReceiptQuantityHint")
                    .replace("{quantity}", String(line.plannedQuantity))
                    .replace("{unit}", line.unit)}
                </p>
              </div>
            )}

            {action === "partial" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("receivedQuantity")} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={line.plannedQuantity - 1}
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                  <p className="mt-1.5 text-xs text-dark-4 dark:text-dark-6">
                    {t("partialQuantityHint").replace(
                      "{quantity}",
                      String(line.plannedQuantity),
                    )}
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("receiptDate")} *
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("confirmationNotes")} *
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </>
            )}

            {action === "complete" && (
              <>
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  {t("completeReceiptHint")
                    .replace("{received}", String(line.actualReceivedQuantity ?? 0))
                    .replace("{remaining}", String(remainingQuantity))
                    .replace("{planned}", String(line.plannedQuantity))
                    .replace("{unit}", line.unit)}
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("remainingReceiptDate")} *
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("confirmationNotes")}{" "}
                    <span className="text-xs font-normal text-dark-4 dark:text-dark-6">
                      {t("optionalSuffix")}
                    </span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </>
            )}

            {action === "not_received" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("confirmationNotes")} *
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t("notReceivedReasonPlaceholder")}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            )}

            {action === "reject" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("rejectionReason")} *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-60"
            >
              {loading ? t("loading") : t("save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
