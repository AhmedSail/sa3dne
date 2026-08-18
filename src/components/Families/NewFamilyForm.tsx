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

interface MemberInput {
  id: string;
  nationalId: string;
  name: string;
  relationship: string;
  educationLevel: string;
  gender: string;
  birthDate: string;
}

export default function NewFamilyForm({ camps }: { camps: CampInfo[] }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    campId: camps.length > 0 ? camps[0].id : "",
    headName: "",
    nationalId: "",
    phone: "",
    memberCount: 1,
    occupation: "",
    notes: "",
    headEmail: "",
    headPassword: "",
  });
  const [members, setMembers] = useState<MemberInput[]>([]);

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

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.campId) {
      toast.error(language === "ar" ? "يجب اختيار مخيم أولاً" : "A camp must be selected first");
      return;
    }
    if (!form.headName || form.headName.trim().length < 2) {
      toast.error(language === "ar" ? "يجب إدخال اسم رب الأسرة بشكل صحيح" : "Family head name must be at least 2 characters");
      return;
    }
    if (!form.nationalId || form.nationalId.trim().length !== 9) {
      toast.error(language === "ar" ? "رقم الهوية يجب أن يكون 9 أرقام بالضبط" : "National ID must be exactly 9 digits");
      return;
    }
    if (!form.phone || form.phone.trim().length < 7) {
      toast.error(language === "ar" ? "رقم الجوال مطلوب" : "Phone number is required");
      return;
    }
    if (!form.headEmail.trim()) {
      toast.error(t("errHeadEmailRequired"));
      return;
    }
    if (form.headPassword.length < 8) {
      toast.error(t("passwordMinLengthError"));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.campId) {
      toast.error(language === "ar" ? "يجب اختيار مخيم أولاً" : "A camp must be selected first");
      return;
    }

    if (form.memberCount < 1) {
      toast.error(t("memberCountValidationError"));
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
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: form.campId,
          headName: form.headName,
          nationalId: form.nationalId,
          phone: form.phone || null,
          memberCount: form.memberCount,
          occupation: form.occupation || null,
          notes: form.notes || null,
          headEmail: form.headEmail.trim(),
          headPassword: form.headPassword,
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {t("addFamily")}
          </h1>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center gap-4 bg-gray-2 px-4 py-2.5 rounded-full dark:bg-dark-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
              step >= 1 ? "bg-primary text-white" : "bg-gray-3 text-dark dark:bg-dark-3 dark:text-white"
            )}>
              1
            </div>
            <span className="text-xs font-semibold text-dark dark:text-white">
              {t("stepBasicInfo")}
            </span>
          </div>
          <div className="h-0.5 w-8 bg-stroke dark:bg-dark-3" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
              step >= 2 ? "bg-primary text-white" : "bg-gray-3 text-dark dark:bg-dark-3 dark:text-dark-6"
            )}>
              2
            </div>
            <span className="text-xs font-semibold text-dark dark:text-white">
              {t("stepFamilyMembers")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        {camps.length === 0 ? (
          <p className="text-center py-6 text-red-500 font-medium">
            {language === "ar"
              ? "غير مصرح لك بتسجيل العائلات لعدم وجود مخيمات مخصصة لك حالياً"
              : "You are not authorized to register families as you have no assigned camps currently."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {step === 1 && (
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
                      maxLength={9}
                      inputMode="numeric"
                      pattern="[0-9]{9}"
                      value={form.nationalId}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                        setForm((prev) => ({ ...prev, nationalId: val }));
                      }}
                      placeholder={language === "ar" ? "9 أرقام" : "9 digits"}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                      {t("phone")} *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
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
                      value={form.memberCount}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-dark-5 dark:text-dark-6">
                      {language === "ar" ? "يتم التحديث تلقائياً عند إضافة الأفراد" : "Auto-updated when adding members"}
                    </p>
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

                <fieldset className="space-y-4 rounded-lg border border-stroke p-4 dark:border-dark-3">
                  <legend className="px-2 text-sm font-semibold text-dark dark:text-white">
                    {t("headAccountSectionTitle")}
                  </legend>
                  <p className="text-xs text-dark-4 dark:text-dark-6">
                    {t("headAccountSectionHint")}
                  </p>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                      {t("headEmailLabel")} *
                    </label>
                    <input
                      type="email"
                      name="headEmail"
                      required
                      value={form.headEmail}
                      onChange={handleChange}
                      placeholder="head@example.com"
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                      {t("headPasswordLabel")} *
                    </label>
                    <input
                      type="password"
                      name="headPassword"
                      required
                      minLength={8}
                      value={form.headPassword}
                      onChange={handleChange}
                      placeholder={t("passwordMinLengthPlaceholder")}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    />
                  </div>
                </fieldset>

                <div className="flex gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90"
                  >
                    {t("nextStep")} &rarr;
                  </button>
                  <Link
                    href="/dashboard/families"
                    className="flex-1 rounded-lg border border-stroke px-5 py-2.5 text-center text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                  >
                    {t("cancel")}
                  </Link>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {/* Family Head Summary Card */}
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-4 text-sm">
                  <span className="font-semibold block text-dark dark:text-white uppercase mb-1">
                    {t("headSummary")}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-dark-5 dark:text-dark-6">
                    <p><strong>{t("headName")}:</strong> {form.headName}</p>
                    <p><strong>{t("nationalId")}:</strong> {form.nationalId}</p>
                    {form.phone && <p><strong>{t("phone")}:</strong> {form.phone}</p>}
                    {form.occupation && <p><strong>{t("occupation")}:</strong> {form.occupation}</p>}
                  </div>
                </div>

                {/* Family Members List Step */}
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
                              maxLength={9}
                              inputMode="numeric"
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 9);
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

                <div className="flex gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-70"
                  >
                    {loading ? t("loading") : t("save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-stroke px-5 py-2.5 text-center text-sm font-semibold text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                  >
                    &larr; {t("prevStep")}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}
      </div>
    </div>
  );
}
