"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { updateCampNeedLevel } from "@/lib/actions/camp-needs";

type CampData = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  needLevel: string;
  operationalStatus: string;
  familiesCount: number;
};

export default function CampNeedsClient({ data, canEdit }: { data: CampData[], canEdit: boolean }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [camps, setCamps] = useState(data);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleNeedChange = async (campId: string, newLevel: "low" | "medium" | "high" | "critical") => {
    setLoadingId(campId);
    const res = await updateCampNeedLevel(campId, newLevel);
    if (res.success) {
      setCamps(camps.map(c => c.id === campId ? { ...c, needLevel: newLevel } : c));
    } else {
      alert(res.error);
    }
    setLoadingId(null);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-dark-3 dark:bg-gray-dark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-sm2 font-bold text-dark dark:text-white">
            {isAr ? "تصنيف احتياجات المخيمات" : "Camp Need Classification"}
          </h2>
          <p className="text-sm text-dark-5 mt-1">
            {isAr 
              ? "عرض وتحديث مستوى الاحتياج لكل مخيم بناءً على الوضع الحالي" 
              : "View and update the need level for each camp based on current situation"}
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto whitespace-nowrap">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-dark-2">
              <th className="px-4 py-4 font-medium text-dark dark:text-white xl:pl-11">
                {t("campName")}
              </th>
              <th className="px-4 py-4 font-medium text-dark dark:text-white">
                {t("campLocation")}
              </th>
              <th className="px-4 py-4 font-medium text-dark dark:text-white text-center">
                {isAr ? "العائلات المسجلة" : "Registered Families"}
              </th>
              <th className="px-4 py-4 font-medium text-dark dark:text-white text-center">
                {t("campNeedLevel")}
              </th>
              {canEdit && (
                <th className="px-4 py-4 font-medium text-dark dark:text-white text-end">
                  {isAr ? "تحديث الاحتياج" : "Update Need"}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {camps.map((camp, key) => (
              <tr key={camp.id} className={key === camps.length - 1 ? "" : "border-b border-stroke dark:border-dark-3"}>
                <td className="px-4 py-5 xl:pl-11">
                  <h5 className="font-medium text-dark dark:text-white">{camp.name}</h5>
                </td>
                <td className="px-4 py-5 text-sm">
                  {t(camp.location as any)}
                </td>
                <td className="px-4 py-5 text-center font-medium">
                  {camp.familiesCount} / {camp.capacity}
                </td>
                <td className="px-4 py-5 text-center">
                  <span className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                    camp.needLevel === "critical" && "bg-red/10 text-red",
                    camp.needLevel === "high" && "bg-orange-500/10 text-orange-500",
                    camp.needLevel === "medium" && "bg-yellow-500/10 text-yellow-500",
                    camp.needLevel === "low" && "bg-green-500/10 text-green-500"
                  )}>
                    {t(`needLevel${camp.needLevel.charAt(0).toUpperCase() + camp.needLevel.slice(1)}` as any)}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-5 text-end">
                    <select
                      className="rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2"
                      value={camp.needLevel}
                      onChange={(e) => handleNeedChange(camp.id, e.target.value as any)}
                      disabled={loadingId === camp.id}
                    >
                      <option value="low">{t("needLevelLow")}</option>
                      <option value="medium">{t("needLevelMedium")}</option>
                      <option value="high">{t("needLevelHigh")}</option>
                      <option value="critical">{t("needLevelCritical")}</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
            {camps.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="py-6 text-center text-dark-5">
                  {isAr ? "لا توجد بيانات متاحة" : "No data available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
