"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { submitUpdateFamilyRequest } from "@/lib/actions/family-requests";

type FamilyData = {
  id: string;
  headName: string;
  nationalId: string;
  phone: string | null;
  memberCount: number;
  occupation: string | null;
  notes: string | null;
  status: string;
  campId: string;
  campName: string | null;
  campLocation: string | null;
} | null;

type Camp = { id: string; name: string; location: string | null };

export default function MyFamilyClient({
  nationalId,
  familyData,
  camps,
  members = [],
  requests = [],
}: {
  nationalId: string;
  familyData: FamilyData;
  camps: Camp[];
  members?: any[];
  requests?: any[];
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const router = useRouter();

  const [form, setForm] = useState({
    headName: familyData?.headName ?? "",
    phone: familyData?.phone ?? "",
    memberCount: familyData?.memberCount ?? 1,
    occupation: familyData?.occupation ?? "",
    notes: familyData?.notes ?? "",
    campId: familyData?.campId ?? (camps[0]?.id ?? ""),
  });
  const [saving, setSaving] = useState(false);
  
  // Member Form State
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    nationalId: "",
    relationship: "son",
    educationLevel: "none",
    gender: "male",
    birthDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!familyData) {
        // Initial creation directly via API
        const res = await fetch("/api/my-family", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, nationalId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        toast.success(isAr ? "تم حفظ بيانات العائلة بنجاح" : "Family data saved successfully");
        router.refresh();
      } else {
        // Update via Request
        const res = await submitUpdateFamilyRequest({
          familyId: familyData.id,
          type: "update_family_info",
          payload: { fields: form },
        });
        if (res.error) throw new Error(res.error);
        toast.success(isAr ? "تم إرسال طلب التحديث للمراجعة" : "Update request submitted for review");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyData) {
      toast.error(isAr ? "يرجى حفظ بيانات العائلة أولاً" : "Please save family data first");
      return;
    }
    setAddingMember(true);
    try {
      const res = await submitUpdateFamilyRequest({
        familyId: familyData.id,
        type: "add_member",
        payload: { member: memberForm },
      });
      if (res.error) throw new Error(res.error);
      toast.success(isAr ? "تم إرسال طلب إضافة الفرد للمراجعة" : "Add member request submitted for review");
      
      setMemberForm({
        name: "",
        nationalId: "",
        relationship: "son",
        educationLevel: "none",
        gender: "male",
        birthDate: "",
      });
      setShowMemberForm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const executeDeleteMember = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    const memberName = members.find((m: any) => m.id === id)?.name || id;

    setConfirmDeleteId(null);
    setDeletingMember(id);
    try {
      if (!familyData) throw new Error("No family data");
      const res = await submitUpdateFamilyRequest({
        familyId: familyData.id,
        type: "remove_member",
        payload: { memberId: id, memberName: memberName },
      });
      if (res.error) throw new Error(res.error);
      toast.success(isAr ? "تم إرسال طلب الحذف للمراجعة" : "Deletion request submitted for review");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingMember(null);
    }
  };

  const locationLabels: Record<string, string> = {
    north_gaza: isAr ? "شمال غزة" : "North Gaza",
    gaza_city: isAr ? "مدينة غزة" : "Gaza City",
    middle_area: isAr ? "المنطقة الوسطى" : "Middle Area",
    khan_yunis: isAr ? "خان يونس" : "Khan Yunis",
    rafah: isAr ? "رفح" : "Rafah",
  };

  const typeLabels: Record<string, string> = {
    add_member: isAr ? "إضافة فرد" : "Add Member",
    remove_member: isAr ? "إزالة فرد" : "Remove Member",
    update_family_info: isAr ? "تحديث معلومات العائلة" : "Update Family Info",
    update_member: isAr ? "تحديث فرد" : "Update Member",
  };

  const statusLabels: Record<string, string> = {
    pending: isAr ? "قيد المراجعة" : "Pending",
    approved: isAr ? "مقبول" : "Approved",
    rejected: isAr ? "مرفوض" : "Rejected",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <h1 className="mb-1 text-2xl font-black text-dark dark:text-white">
          {isAr ? "معلومات عائلتي" : "My Family Information"}
        </h1>
        <p className="mb-6 text-sm text-dark-4 dark:text-dark-6">
          {isAr
            ? `رقم الهوية: ${nationalId}`
            : `National ID: ${nationalId}`}
        </p>

        {/* Camp Info Card */}
        {familyData && (
          <div className="mb-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
              {isAr ? "موقعكم في المخيم" : "Your Camp Location"}
            </p>
            <p className="text-lg font-bold text-dark dark:text-white">
              {familyData.campName ?? "—"}
            </p>
            <p className="text-sm text-dark-4 dark:text-dark-6">
              {familyData.campLocation ? locationLabels[familyData.campLocation] ?? familyData.campLocation : "—"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "اسم رب الأسرة *" : "Head of Family Name *"}
              </label>
              <input
                name="headName"
                required
                value={form.headName}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "عدد أفراد الأسرة *" : "Number of Family Members *"}
              </label>
              <input
                name="memberCount"
                type="number"
                min={1}
                required
                value={form.memberCount}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "المهنة" : "Occupation"}
              </label>
              <input
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "المخيم *" : "Camp *"}
              </label>
              <select
                name="campId"
                required
                value={form.campId}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {camps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.location ? locationLabels[c.location] ?? c.location : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                {isAr ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-60"
            >
              {saving
                ? isAr ? "جاري الإرسال..." : "Sending..."
                : familyData
                ? isAr ? "إرسال طلب التحديث" : "Submit Update Request"
                : isAr ? "تسجيل عائلتي" : "Register My Family"}
            </button>
          </div>
        </form>
      </div>
      
      {/* أفراد العائلة */}
      {familyData && (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-dark dark:text-white">
                {isAr ? "أفراد العائلة" : "Family Members"}
              </h2>
              <p className="mt-1 text-sm text-dark-4 dark:text-dark-6">
                {isAr ? "إدارة التابعين في أسرتك" : "Manage your dependents"}
              </p>
            </div>
            <button
              onClick={() => setShowMemberForm(!showMemberForm)}
              className="inline-flex justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
            >
              {showMemberForm ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "+ طلب إضافة فرد" : "+ Request Add Member")}
            </button>
          </div>
          
          {showMemberForm && (
            <form onSubmit={handleAddMember} className="mb-6 rounded-lg bg-gray-1 p-5 dark:bg-dark-2 border border-stroke dark:border-dark-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {isAr ? "الاسم الرباعي *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {isAr ? "رقم الهوية (اختياري)" : "ID Number (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={memberForm.nationalId}
                    onChange={(e) => setMemberForm({ ...memberForm, nationalId: e.target.value })}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {isAr ? "تاريخ الميلاد (اختياري)" : "Birth Date (Optional)"}
                  </label>
                  <input
                    type="date"
                    value={memberForm.birthDate}
                    onChange={(e) => setMemberForm({ ...memberForm, birthDate: e.target.value })}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {isAr ? "صلة القرابة *" : "Relationship *"}
                  </label>
                  <select
                    required
                    value={memberForm.relationship}
                    onChange={(e) => setMemberForm({ ...memberForm, relationship: e.target.value })}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  >
                    <option value="son">{isAr ? "ابن" : "Son"}</option>
                    <option value="daughter">{isAr ? "ابنة" : "Daughter"}</option>
                    <option value="wife">{isAr ? "زوجة" : "Wife"}</option>
                    <option value="husband">{isAr ? "زوج" : "Husband"}</option>
                    <option value="mother">{isAr ? "أم" : "Mother"}</option>
                    <option value="father">{isAr ? "أب" : "Father"}</option>
                    <option value="other">{isAr ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {isAr ? "الجنس *" : "Gender *"}
                  </label>
                  <select
                    required
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  >
                    <option value="male">{isAr ? "ذكر" : "Male"}</option>
                    <option value="female">{isAr ? "أنثى" : "Female"}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {isAr ? "المستوى التعليمي *" : "Education Level *"}
                  </label>
                  <select
                    required
                    value={memberForm.educationLevel}
                    onChange={(e) => setMemberForm({ ...memberForm, educationLevel: e.target.value })}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  >
                    <option value="none">{isAr ? "أمي" : "None"}</option>
                    <option value="elementary">{isAr ? "ابتدائي" : "Elementary"}</option>
                    <option value="preparatory">{isAr ? "إعدادي" : "Preparatory"}</option>
                    <option value="secondary">{isAr ? "ثانوي" : "Secondary"}</option>
                    <option value="university">{isAr ? "جامعي" : "University"}</option>
                    <option value="post_graduate">{isAr ? "دراسات عليا" : "Post Graduate"}</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={addingMember}
                  className="flex w-full sm:w-auto items-center justify-center rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  {addingMember ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الطلب" : "Submit Request")}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2 text-right dark:border-dark-3 dark:bg-dark-2">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "الاسم" : "Name"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "القرابة" : "Relationship"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "الجنس" : "Gender"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "التعليم" : "Education"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white text-left">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {!members || members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-dark-4 dark:text-dark-6">
                      {isAr ? "لا يوجد أفراد مضافين بعد" : "No family members added yet"}
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="border-b border-stroke dark:border-dark-3 hover:bg-gray-1 dark:hover:bg-dark-2">
                      <td className="px-4 py-3 text-dark dark:text-white font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                        {isAr ? 
                          (member.relationship === 'son' ? 'ابن' : 
                           member.relationship === 'daughter' ? 'ابنة' : 
                           member.relationship === 'wife' ? 'زوجة' : 
                           member.relationship === 'husband' ? 'زوج' : 
                           member.relationship === 'mother' ? 'أم' : 
                           member.relationship === 'father' ? 'أب' : 'أخرى') 
                          : member.relationship}
                      </td>
                      <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                        {isAr ? (member.gender === 'male' ? 'ذكر' : 'أنثى') : member.gender}
                      </td>
                      <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                        {isAr ? 
                          (member.educationLevel === 'none' ? 'أمي' : 
                           member.educationLevel === 'elementary' ? 'ابتدائي' : 
                           member.educationLevel === 'preparatory' ? 'إعدادي' : 
                           member.educationLevel === 'secondary' ? 'ثانوي' : 
                           member.educationLevel === 'university' ? 'جامعي' : 'دراسات عليا') 
                          : member.educationLevel}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <button
                          onClick={() => setConfirmDeleteId(member.id)}
                          disabled={deletingMember === member.id}
                          className="text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingMember === member.id ? "..." : (isAr ? "طلب حذف" : "Request Delete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* طلبات التحديث */}
      {familyData && requests && requests.length > 0 && (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark mt-6">
          <h2 className="mb-4 text-xl font-bold text-dark dark:text-white">
            {isAr ? "طلبات التحديث" : "Update Requests"}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-stroke bg-gray-2 text-right dark:border-dark-3 dark:bg-dark-2">
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "نوع الطلب" : "Request Type"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "تاريخ الطلب" : "Date"}</th>
                  <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "سبب الرفض" : "Rejection Reason"}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-stroke dark:border-dark-3">
                    <td className="px-4 py-3 text-dark dark:text-white">{typeLabels[req.type] || req.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : req.status === 'approved' ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
                        {statusLabels[req.status] || req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                      {req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : "-"}
                    </td>
                    <td className="px-4 py-3 text-red-500">
                      {req.rejectionReason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* نافذة تأكيد الحذف */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-gray-dark border border-stroke dark:border-dark-3">
            <h3 className="mb-4 text-lg font-bold text-dark dark:text-white">
              {isAr ? "تأكيد الحذف" : "Confirm Deletion"}
            </h3>
            <p className="mb-6 text-sm text-dark-4 dark:text-dark-6">
              {isAr 
                ? "هل أنت متأكد من رغبتك في إرسال طلب حذف هذا الفرد من عائلتك؟" 
                : "Are you sure you want to request the deletion of this member from your family?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg bg-gray-2 px-4 py-2 text-sm font-medium text-dark hover:bg-gray-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={executeDeleteMember}
                className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                {isAr ? "نعم، تأكيد الحذف" : "Yes, confirm deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
