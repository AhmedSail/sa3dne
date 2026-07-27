"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CampOption = { id: string; name: string };
type AidTypeOption = { id: string; name: string; defaultUnit: string };

type LineItem = {
  id: string; // temporary id for UI mapping
  campId: string;
  aidTypeId: string;
  plannedQuantity: string;
  unit: string;
  plannedDeliveryDate: string;
};

export default function NewContribution({
  providerName,
  camps,
  aidTypes,
}: {
  providerName: string;
  camps: CampOption[];
  aidTypes: AidTypeOption[];
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      campId: "",
      aidTypeId: "",
      plannedQuantity: "",
      unit: "",
      plannedDeliveryDate: "",
    },
  ]);

  const isAr = language === "ar";

  const handleLineChange = (
    id: string,
    field: keyof LineItem,
    value: string
  ) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id === id) {
          const updated = { ...line, [field]: value };
          if (field === "aidTypeId") {
            const at = aidTypes.find((a) => a.id === value);
            updated.unit = updated.unit || (at?.defaultUnit ?? "");
          }
          return updated;
        }
        return line;
      })
    );
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        campId: "",
        aidTypeId: "",
        plannedQuantity: "",
        unit: "",
        plannedDeliveryDate: "",
      },
    ]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validLines = lines.filter(
      (l) => l.campId && l.aidTypeId && l.plannedQuantity && l.unit
    );

    if (validLines.length === 0) {
      toast.error(isAr ? "يرجى إضافة بند واحد على الأقل وإكمال بياناته" : "Please add and complete at least one line.");
      return;
    }

    const payloadLines = validLines.map((l) => ({
      campId: l.campId,
      aidTypeId: l.aidTypeId,
      plannedQuantity: Number(l.plannedQuantity),
      unit: l.unit,
      plannedDeliveryDate: l.plannedDeliveryDate || null,
    }));

    if (payloadLines.some((l) => isNaN(l.plannedQuantity) || l.plannedQuantity <= 0)) {
      toast.error(t("quantityValidationError"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contributions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || null,
          lines: payloadLines,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success(isAr ? "تم إرسال المساهمة بنجاح!" : "Contribution submitted successfully!");
        router.push(`/dashboard/contributions/${created.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || t("error"));
        setLoading(false);
      }
    } catch {
      toast.error(t("error"));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {isAr ? "تقديم مساعدة جديدة" : "Submit New Contribution"}
        </h1>
        <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
          {isAr
            ? "قم بإضافة كل المساعدات التي ترغب في التبرع بها للمخيمات وأرسلها بضغطة زر واحدة."
            : "Add all the aid items you want to donate to the camps and submit them with one click."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider and Notes Info */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("provider")}
              </label>
              <input
                type="text"
                value={providerName}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-stroke bg-gray-1 px-4 py-2.5 text-sm text-dark-4 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {t("notes")}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? "أي ملاحظات عامة حول هذه الشحنة..." : "General notes about this shipment..."}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Lines */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark space-y-4">
          <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
            <h2 className="text-lg font-bold text-dark dark:text-white">
              {isAr ? "تفاصيل المساعدات (البنود)" : "Aid Details (Items)"}
            </h2>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="grid grid-cols-1 items-end gap-3 rounded-lg border border-stroke bg-gray-1 p-4 dark:border-dark-3 dark:bg-dark-2 lg:grid-cols-12"
              >
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                    {t("camps")} *
                  </label>
                  <select
                    value={line.campId}
                    onChange={(e) => handleLineChange(line.id, "campId", e.target.value)}
                    required
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  >
                    <option value="">{t("selectCampPlaceholder")}</option>
                    {camps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                    {t("aidType")} *
                  </label>
                  <select
                    value={line.aidTypeId}
                    onChange={(e) => handleLineChange(line.id, "aidTypeId", e.target.value)}
                    required
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  >
                    <option value="">{t("selectAidTypePlaceholder")}</option>
                    {aidTypes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                    {t("plannedQuantity")} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={line.plannedQuantity}
                    onChange={(e) => handleLineChange(line.id, "plannedQuantity", e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                    {t("unit")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={line.unit}
                    onChange={(e) => handleLineChange(line.id, "unit", e.target.value)}
                    placeholder={isAr ? "صندوق، لتر" : "box, liter"}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-dark dark:text-white">
                    {t("plannedDeliveryDate")}
                  </label>
                  <input
                    type="date"
                    value={line.plannedDeliveryDate}
                    onChange={(e) => handleLineChange(line.id, "plannedDeliveryDate", e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                  />
                </div>

                <div className="lg:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white"
            >
              + {isAr ? "إضافة مخيم/بند آخر" : "Add another camp/item"}
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/contributions")}
            className="rounded-lg border border-stroke px-6 py-3 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-primary px-6 py-3 text-center text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {loading ? t("loading") : (isAr ? "إرسال واعتماد المساهمة" : "Submit Contribution")}
          </button>
        </div>
      </form>
    </div>
  );
}
