"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { approveFamilyRequest, rejectFamilyRequest } from "@/lib/actions/family-requests";

export default function FamilyRequestsClient({ requests }: { requests: any[] }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const router = useRouter();
  
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const executeApprove = async () => {
    if (!confirmApproveId) return;
    const id = confirmApproveId;
    setConfirmApproveId(null);
    setProcessing(id);
    try {
      const res = await approveFamilyRequest(id);
      if (res.error) throw new Error(t(res.error));
      toast.success(isAr ? "تمت الموافقة وتحديث البيانات بنجاح" : "Approved and data updated successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error(isAr ? "يرجى كتابة سبب الرفض أولاً" : "Please enter a rejection reason first");
      return;
    }
    setProcessing(id);
    try {
      const res = await rejectFamilyRequest(id, rejectReason);
      if (res.error) throw new Error(t(res.error));
      toast.success(isAr ? "تم رفض الطلب بنجاح" : "Request rejected successfully");
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const typeLabels: Record<string, string> = {
    add_member: isAr ? "إضافة فرد" : "Add Member",
    remove_member: isAr ? "إزالة فرد" : "Remove Member",
    update_family_info: isAr ? "تحديث معلومات العائلة" : "Update Family Info",
    update_member: isAr ? "تحديث فرد" : "Update Member",
  };

  const renderPayload = (type: string, payload: any) => {
    if (type === "add_member") {
      return (
        <div className="text-xs">
          <strong>{isAr ? "الاسم: " : "Name: "}</strong>{payload.member.name}<br/>
          <strong>{isAr ? "الهوية: " : "ID: "}</strong>{payload.member.nationalId || "-"}<br/>
          <strong>{isAr ? "القرابة: " : "Relation: "}</strong>{payload.member.relationship}
        </div>
      );
    }
    if (type === "update_family_info") {
      return (
        <div className="text-xs">
          <strong>{isAr ? "رب الأسرة: " : "Head: "}</strong>{payload.fields.headName}<br/>
          <strong>{isAr ? "الهاتف: " : "Phone: "}</strong>{payload.fields.phone}<br/>
          <strong>{isAr ? "العدد: " : "Count: "}</strong>{payload.fields.memberCount}
        </div>
      );
    }
    if (type === "remove_member") {
      return (
        <div className="text-xs">
          <strong>{isAr ? "الاسم المزال: " : "Removed Name: "}</strong>{payload.memberName || payload.memberId}
        </div>
      );
    }
    return <pre className="text-xs bg-gray-1 p-2 rounded max-w-[200px] overflow-auto">{JSON.stringify(payload, null, 2)}</pre>;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <h1 className="mb-6 text-2xl font-black text-dark dark:text-white">
          {isAr ? "طلبات تحديث العائلات (قيد الانتظار)" : "Pending Family Update Requests"}
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 text-right dark:border-dark-3 dark:bg-dark-2">
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "العائلة" : "Family"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "نوع الطلب" : "Type"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "البيانات المطلوبة" : "Requested Data"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "التاريخ" : "Date"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-dark-4 dark:text-dark-6">
                    {isAr ? "لا توجد طلبات قيد الانتظار" : "No pending requests"}
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark dark:text-white">{req.familyHeadName}</div>
                      <div className="text-xs text-dark-4">{req.familyNationalId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {typeLabels[req.type] || req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                      {renderPayload(req.type, req.payload)}
                    </td>
                    <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                      {req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {rejectingId === req.id ? (
                        <div className="flex flex-col gap-2">
                          <input 
                            type="text" 
                            placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full rounded border-[1.5px] border-stroke px-2 py-1 text-xs outline-none dark:border-dark-3 dark:bg-dark-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={processing === req.id}
                              className="rounded bg-red px-2 py-1 text-xs text-white hover:bg-opacity-90 disabled:opacity-50"
                            >
                              {isAr ? "تأكيد الرفض" : "Confirm Reject"}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(""); }}
                              disabled={processing === req.id}
                              className="rounded bg-gray-3 px-2 py-1 text-xs text-dark hover:bg-gray-4 dark:bg-dark-3 dark:text-white"
                            >
                              {isAr ? "إلغاء" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmApproveId(req.id)}
                            disabled={processing === req.id}
                            className="rounded bg-green px-3 py-1.5 text-xs text-white hover:bg-opacity-90 disabled:opacity-50"
                          >
                            {isAr ? "موافقة" : "Approve"}
                          </button>
                          <button
                            onClick={() => setRejectingId(req.id)}
                            disabled={processing === req.id}
                            className="rounded bg-red px-3 py-1.5 text-xs text-white hover:bg-opacity-90 disabled:opacity-50"
                          >
                            {isAr ? "رفض" : "Reject"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval confirmation dialog */}
      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-gray-dark border border-stroke dark:border-dark-3">
            <h3 className="mb-4 text-lg font-bold text-dark dark:text-white">
              {isAr ? "تأكيد الموافقة" : "Confirm Approval"}
            </h3>
            <p className="mb-6 text-sm text-dark-4 dark:text-dark-6">
              {isAr 
                ? "هل أنت متأكد من رغبتك في الموافقة على هذا الطلب وتحديث بيانات العائلة؟" 
                : "Are you sure you want to approve this request and update the family data?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmApproveId(null)}
                className="rounded-lg bg-gray-2 px-4 py-2 text-sm font-medium text-dark hover:bg-gray-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={executeApprove}
                className="rounded-lg bg-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                {isAr ? "نعم، تأكيد الموافقة" : "Yes, confirm approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
