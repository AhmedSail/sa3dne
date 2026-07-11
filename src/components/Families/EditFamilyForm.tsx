"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CampInfo = {
  id: string;
  name: string;
};

type FamilyMemberData = {
  id: string;
  nationalId?: string | null;
  name: string;
  relationship: string;
  educationLevel: string;
  gender: string;
  birthDate: Date | string | null;
};

type FamilyData = {
  id: string;
  campId: string;
  headName: string;
  nationalId: string;
  phone: string | null;
  memberCount: number;
  occupation: string | null;
  notes: string | null;
  members: FamilyMemberData[];
};

interface MemberInput {
  id: string;
  nationalId: string;
  name: string;
  relationship: string;
  educationLevel: string;
  gender: string;
  birthDate: string;
}

export default function EditFamilyForm({
  family,
  camps,
}: {
  family: FamilyData;
  camps: CampInfo[];
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");
  const [form, setForm] = useState({
    campId: family.campId,
    headName: family.headName,
    nationalId: family.nationalId,
    phone: family.phone ?? "",
    memberCount: family.memberCount,
    occupation: family.occupation ?? "",
    notes: family.notes ?? "",
  });
  const [members, setMembers] = useState<MemberInput[]>(
    (family.members || []).map((m) => {
      let bDateStr = "";
      if (m.birthDate) {
        try {
          bDateStr = new Date(m.birthDate).toISOString().split("T")[0];
        } catch (e) {
          bDateStr = "";
        }
      }
      return {
        id: m.id,
        nationalId: m.nationalId ?? "",
        name: m.name,
        relationship: m.relationship,
        educationLevel: m.educationLevel,
        gender: m.gender || "male",
        birthDate: bDateStr,
      };
    }),
  );

  // Automatically update memberCount when family members are added or removed
  useEffect(() => {
    setForm((prev) => ({ ...prev, memberCount: members.length + 1 }));
  }, [members]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "memberCount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.campId) {
      toast.error(language === "ar" ? "يجب اختيار مخيم أولاً" : "A camp must be selected first");
      return;
    }

    if (!form.headName || form.headName.trim().length < 2) {
      toast.error(language === "ar" ? "يجب إدخال اسم رب الأسرة بشكل صحيح" : "Family head name must be at least 2 characters");
      return;
    }

    if (!form.nationalId || form.nationalId.trim().length < 4) {
      toast.error(language === "ar" ? "رقم الهوية غير صالح" : "A valid national ID is required");
      return;
    }

    // Verify all members have required data
    for (const m of members) {
      if (!m.name.trim()) {
        toast.error(language === "ar" ? "اسم الفرد مطلوب لجميع الأفراد المضافين" : "Member name is required for all added members");
        return;
      }
      if (!m.birthDate) {
        toast.error(language === "ar" ? `تاريخ ميلاد الفرد (${m.name || "الفرد الجديد"}) مطلوب` : `Birth date is required for ${m.name || "new member"}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/families/${family.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: form.campId,
          headName: form.headName,
          nationalId: form.nationalId,
          phone: form.phone || null,
          memberCount: form.memberCount,
          occupation: form.occupation || null,
          notes: form.notes || null,
          members: members.map(({ nationalId, name, relationship, educationLevel, gender, birthDate }) => ({
            nationalId: nationalId || null,
            name,
            relationship,
            educationLevel,
            gender,
            birthDate: birthDate || null,
          })),
        }),
      });

      if (res.ok) {
        toast.success(t("success"));
        router.push("/dashboard/families");
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">
          {t("editFamily")}
        </h1>
      </div>

      {/* Tabs Control Switcher */}
      <div className="border-b border-stroke dark:border-dark-3">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            {t("stepBasicInfo")}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-dark-5 hover:text-primary dark:text-dark-6"
            )}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {t("stepFamilyMembers")} ({members.length})
          </button>
        </div>
      </div>

      <div className="max-w-5xl rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {activeTab === "info" && (
            <div className="space-y-4 animate-fade-in max-w-2xl">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("camps")} *
                </label>
                <select
                  name="campId"
                  required
                  value={form.campId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                  {t("headName")} *
                </label>
                <input
                  type="text"
                  name="headName"
                  required
                  value={form.headName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("nationalId")} *
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    required
                    value={form.nationalId}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
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
                    onChange={handleChange}
                    placeholder="+966501234567"
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("occupation")}
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    placeholder={language === "ar" ? "مثال: معلم، مزارع، تاجر" : "e.g. Teacher, Farmer, Merchant"}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    {t("memberCount")} *
                  </label>
                  <input
                    type="number"
                    name="memberCount"
                    required
                    min={1}
                    disabled
                    value={form.memberCount}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent bg-gray-2 px-4 py-3 text-sm outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white opacity-70 cursor-not-allowed"
                  />
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
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4 animate-fade-in">
              {/* Family Members List Tab */}
              <div className="rounded-lg border border-stroke bg-gray-2 p-4 dark:border-dark-3 dark:bg-dark-2">
                <div className="mb-3 flex items-center justify-between border-b border-stroke pb-2 dark:border-dark-3">
                  <h3 className="text-sm font-semibold text-dark dark:text-white">
                    {t("familyMembers")}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((prev) => [
                        ...prev,
                        {
                          id: Math.random().toString(),
                          nationalId: "",
                          name: "",
                          relationship: "wife",
                          educationLevel: "edu_none",
                          gender: "female",
                          birthDate: "",
                        },
                      ])
                    }
                    className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-opacity-90"
                  >
                    + {t("addMember")}
                  </button>
                </div>

                {members.length === 0 ? (
                  <p className="text-center text-xs text-dark-5 dark:text-dark-6 py-4 bg-white dark:bg-gray-dark rounded border border-stroke dark:border-dark-4">
                    {language === "ar" ? "لم يتم إضافة أفراد بعد (فقط رب الأسرة)" : "No members added yet (only family head)"}
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                    {/* Header line for desktop views to make columns layout aligned */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs font-semibold text-dark-4 dark:text-dark-6 px-3">
                      <div className="md:col-span-3">{t("memberName")} *</div>
                      <div className="md:col-span-2">{t("relationship")}</div>
                      <div className="md:col-span-2">{t("educationLevel")}</div>
                      <div className="md:col-span-2">{t("gender")}</div>
                      <div className="md:col-span-2">{t("birthDate")} *</div>
                      <div className="md:col-span-1 text-center">{t("actions")}</div>
                    </div>

                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="grid grid-cols-1 gap-2.5 rounded border border-stroke bg-white p-3 dark:border-dark-4 dark:bg-gray-dark md:grid-cols-12 md:gap-3 md:items-center"
                      >
                        <div className="md:col-span-12">
                          <label className="mb-1 block text-xs font-semibold text-dark-4 dark:text-dark-6">
                            {t("memberNationalId")}
                          </label>
                          <input
                            type="text"
                            value={m.nationalId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, nationalId: val } : item,
                                ),
                              );
                            }}
                            placeholder={t("memberNationalId")}
                            className="w-full rounded border border-stroke bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          />
                        </div>

                        {/* Name Input */}
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            required
                            placeholder={t("memberName")}
                            value={m.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, name: val } : item,
                                ),
                              );
                            }}
                            className="w-full rounded border border-stroke bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          />
                        </div>

                        {/* Relationship Selection */}
                        <div className="md:col-span-2">
                          <select
                            value={m.relationship}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, relationship: val } : item,
                                ),
                              );
                            }}
                            className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-xs outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          >
                            <option value="wife">{t("wife")}</option>
                            <option value="son">{t("son")}</option>
                            <option value="daughter">{t("daughter")}</option>
                            <option value="husband">{t("husband")}</option>
                            <option value="parent">{t("parent")}</option>
                            <option value="otherRelation">{t("otherRelation")}</option>
                          </select>
                        </div>

                        {/* Education Stage Selection */}
                        <div className="md:col-span-2">
                          <select
                            value={m.educationLevel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, educationLevel: val } : item,
                                ),
                              );
                            }}
                            className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-xs outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          >
                            <option value="edu_none">{t("edu_none")}</option>
                            <option value="edu_elementary">{t("edu_elementary")}</option>
                            <option value="edu_preparatory">{t("edu_preparatory")}</option>
                            <option value="edu_secondary">{t("edu_secondary")}</option>
                            <option value="edu_university">{t("edu_university")}</option>
                            <option value="edu_post_graduate">{t("edu_post_graduate")}</option>
                          </select>
                        </div>

                        {/* Gender Selection */}
                        <div className="md:col-span-2">
                          <select
                            value={m.gender}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, gender: val } : item,
                                ),
                              );
                            }}
                            className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-xs outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          >
                            <option value="male">{t("male")}</option>
                            <option value="female">{t("female")}</option>
                          </select>
                        </div>

                        {/* Birth Date Selection */}
                        <div className="md:col-span-2">
                          <input
                            type="date"
                            required
                            value={m.birthDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMembers((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, birthDate: val } : item,
                                ),
                              );
                            }}
                            className="w-full rounded border border-stroke bg-transparent px-2 py-1 text-xs outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                          />
                        </div>

                        {/* Remove Action */}
                        <div className="md:col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setMembers((prev) => prev.filter((item) => item.id !== m.id))
                            }
                            className="text-xs text-red hover:underline focus:outline-none shrink-0"
                          >
                            {t("removeMember")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons (Always Visible at bottom) */}
          <div className="flex gap-3 pt-4 border-t border-stroke dark:border-dark-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-70"
            >
              {loading ? t("loading") : t("save")}
            </button>
            <Link
              href="/dashboard/families"
              className="flex-1 rounded-lg border border-stroke px-5 py-2.5 text-center text-sm font-semibold text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              {t("cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
