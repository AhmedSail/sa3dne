"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ExportButtons from "../ExportButtons";

type FamilyWithCamp = {
  id: string;
  headName: string;
  nationalId: string;
  phone: string | null;
  memberCount: number;
  campName: string;
  campId: string;
  campLocation: string;
  occupation: string | null;
  status: string;
};

export default function FamiliesList({
  initialFamilies,
  isManagerOrAdmin,
}: {
  initialFamilies: FamilyWithCamp[];
  isManagerOrAdmin: boolean;
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [families, setFamilies] = useState<FamilyWithCamp[]>(initialFamilies);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters State
  const [selectedCampId, setSelectedCampId] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  async function handleDeactivate(id: string) {
    const reason = prompt(
      language === "ar"
        ? "يرجى إدخال سبب إيقاف نشاط / مغادرة العائلة:"
        : "Please enter the reason for deactivating/family departure:",
    );

    if (reason === null) return; // cancelled
    if (reason.trim() === "") {
      toast.error(language === "ar" ? "السبب مطلوب لإتمام العملية" : "Reason is required to proceed");
      return;
    }

    setLoadingId(id);
    try {
      const res = await fetch(`/api/families/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inactiveReason: reason }),
      });

      if (res.ok) {
        toast.success(t("success"));
        // Remove from local list
        setFamilies((prev) => prev.filter((f) => f.id !== id));
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t("error"));
      }
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setLoadingId(null);
    }
  }

  // Get unique options from loaded list dynamically
  const uniqueCamps = Array.from(
    new Set(families.map((f) => JSON.stringify({ id: f.campId, name: f.campName })))
  ).map((str) => JSON.parse(str) as { id: string; name: string });

  const uniqueOccupations = Array.from(
    new Set(families.map((f) => f.occupation).filter((occ): occ is string => !!occ))
  );

  // Apply filters
  const filteredFamilies = families.filter((f) => {
    // Search Term Match (headName, nationalId, campName)
    const matchesSearch =
      f.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.nationalId.includes(searchTerm) ||
      f.campName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Camp Match
    if (selectedCampId && f.campId !== selectedCampId) return false;

    // Governorate Match
    if (selectedGovernorate && f.campLocation !== selectedGovernorate) return false;

    // Occupation Match
    if (selectedOccupation && (!f.occupation || f.occupation.toLowerCase() !== selectedOccupation.toLowerCase())) {
      return false;
    }

    // Min Size Match
    if (minSize && f.memberCount < Number(minSize)) return false;

    // Max Size Match
    if (maxSize && f.memberCount > Number(maxSize)) return false;

    return true;
  });

  // Calculate stats
  const totalFamiliesCount = filteredFamilies.length;
  const totalIndividualsCount = filteredFamilies.reduce((acc, f) => acc + f.memberCount, 0);

  const clearFilters = () => {
    setSelectedCampId("");
    setSelectedGovernorate("");
    setSelectedOccupation("");
    setMinSize("");
    setMaxSize("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredFamilies.length / ITEMS_PER_PAGE);
  const paginatedFamilies = filteredFamilies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {t("familiesList")}
          </h1>
          <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
            {language === "ar"
              ? "تسجيل ومتابعة العائلات في المخيمات لأغراض الإحصاء"
              : "Register and track families in camps for statistical purposes"}
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButtons 
            data={filteredFamilies}
            filename="قائمة_العائلات"
            columns={[
              { key: "headName", label: "اسم رب الأسرة" },
              { key: "nationalId", label: "رقم الهوية" },
              { key: "phone", label: "رقم الهاتف" },
              { key: "memberCount", label: "عدد الأفراد" },
              { key: "campName", label: "المخيم" }
            ]}
          />
          {isManagerOrAdmin && (
            <Link
              href="/dashboard/families/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-opacity-90 self-start sm:self-auto print:hidden"
            >
              <span className="text-lg leading-none">+</span>
              {t("addFamily")}
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 print:hidden">
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase">
            {language === "ar" ? "إجمالي العائلات" : "Total Families"}
          </p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {totalFamiliesCount}
          </p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-semibold text-dark-4 dark:text-dark-6 uppercase">
            {language === "ar" ? "إجمالي عدد الأفراد" : "Total Individuals"}
          </p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
            {totalIndividualsCount}
          </p>
        </div>
      </div>

      {/* Filter / Search Dashboard Panel */}
      <div className="mb-6 rounded-xl border border-stroke bg-white p-4 shadow-default dark:border-dark-3 dark:bg-gray-dark print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder={language === "ar" ? "البحث بالاسم، الرقم الوطني، أو المخيم..." : "Search by name, national ID, or camp..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {language === "ar" ? "خيارات التصفية" : "Custom Filters"}
            </button>
            {(selectedCampId || selectedGovernorate || selectedOccupation || minSize || maxSize) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-red-500 hover:underline"
              >
                {language === "ar" ? "مسح التصفية" : "Clear Filters"}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filter Form */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-stroke pt-4 dark:border-dark-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("camps")}
              </label>
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-xs outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              >
                <option value="">{language === "ar" ? "كل المخيمات" : "All Camps"}</option>
                {uniqueCamps.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("campLocation")}
              </label>
              <select
                value={selectedGovernorate}
                onChange={(e) => setSelectedGovernorate(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-xs outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              >
                <option value="">{language === "ar" ? "كل المحافظات" : "All Governorates"}</option>
                <option value="north_gaza">{t("north_gaza")}</option>
                <option value="gaza_city">{t("gaza_city")}</option>
                <option value="middle_area">{t("middle_area")}</option>
                <option value="khan_yunis">{t("khan_yunis")}</option>
                <option value="rafah">{t("rafah")}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dark-4 dark:text-dark-6">
                {t("occupation")}
              </label>
              <select
                value={selectedOccupation}
                onChange={(e) => setSelectedOccupation(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-xs outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              >
                <option value="">{language === "ar" ? "كل المهن" : "All Occupations"}</option>
                {uniqueOccupations.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-dark-4 dark:text-dark-6">
                {language === "ar" ? "عدد الأفراد (من - إلى)" : "Member Count (Min - Max)"}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder={language === "ar" ? "الأقل" : "Min"}
                  value={minSize}
                  onChange={(e) => setMinSize(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
                <input
                  type="number"
                  min={1}
                  placeholder={language === "ar" ? "الأكثر" : "Max"}
                  value={maxSize}
                  onChange={(e) => setMaxSize(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto text-sm text-right">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2">
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("headName")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("nationalId")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("phone")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("occupation")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("memberCount")}
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                  {t("camps")}
                </th>
                {isManagerOrAdmin && (
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-dark-4 dark:text-dark-6">
                    {t("actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {paginatedFamilies.length === 0 ? (
                <tr>
                  <td
                    colSpan={isManagerOrAdmin ? 7 : 6}
                    className="px-4 py-12 text-center text-sm text-dark-4 dark:text-dark-6"
                  >
                    {language === "ar" ? "لا يوجد عائلات مسجلة بعد" : "No families registered yet"}
                  </td>
                </tr>
              ) : (
                paginatedFamilies.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-gray-1 dark:hover:bg-dark-2"
                  >
                    {/* Head Name */}
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-primary hover:underline">
                      <Link href={`/dashboard/families/${item.id}`}>
                        {item.headName}
                      </Link>
                    </td>

                    {/* National ID */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {item.nationalId}
                    </td>

                    {/* Phone */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {item.phone ?? "—"}
                    </td>

                    {/* Occupation */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {item.occupation ?? "—"}
                    </td>

                    {/* Member Count */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-dark-4 dark:text-dark-6">
                      {item.memberCount}
                    </td>

                    {/* Camp Name */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Link
                        href={`/dashboard/camps/${item.campId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.campName}
                      </Link>
                    </td>

                    {/* Actions */}
                    {isManagerOrAdmin && (
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/families/${item.id}/edit`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {t("edit")}
                          </Link>
                          <button
                            onClick={() => handleDeactivate(item.id)}
                            disabled={loadingId === item.id}
                            className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40"
                          >
                            {loadingId === item.id ? "..." : t("deactivate")}
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

        {/* Pagination Footer */}
        {filteredFamilies.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-stroke px-4 py-3 dark:border-dark-3 gap-3">
            <p className="text-xs text-dark-4 dark:text-dark-6">
              {language === "ar"
                ? `عرض ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredFamilies.length)} من إجمالي ${filteredFamilies.length} عائلة`
                : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredFamilies.length)} of ${filteredFamilies.length} families`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded px-2 py-1 text-xs font-medium bg-gray-2 text-dark-4 disabled:opacity-50 dark:bg-dark-2 dark:text-dark-6 hover:bg-gray-3 dark:hover:bg-dark-3 transition"
                >
                  {language === "ar" ? "السابق" : "Prev"}
                </button>
                <span className="text-xs font-medium text-dark-4 dark:text-dark-6">
                  {currentPage} {language === "ar" ? "من" : "of"} {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded px-2 py-1 text-xs font-medium bg-gray-2 text-dark-4 disabled:opacity-50 dark:bg-dark-2 dark:text-dark-6 hover:bg-gray-3 dark:hover:bg-dark-3 transition"
                >
                  {language === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
