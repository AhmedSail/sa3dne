"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export default function RejectedRequestsClient({ requests }: { requests: any[] }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
          {isAr ? "طلبات التحديث المرفوضة (سجل التدقيق)" : "Rejected Update Requests (Audit Log)"}
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 text-right dark:border-dark-3 dark:bg-dark-2">
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "العائلة" : "Family"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "نوع الطلب" : "Type"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "البيانات" : "Data"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "سبب الرفض" : "Rejection Reason"}</th>
                <th className="px-4 py-3 font-medium text-dark dark:text-white">{isAr ? "تاريخ الرفض" : "Rejected At"}</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-dark-4 dark:text-dark-6">
                    {isAr ? "لا توجد طلبات مرفوضة" : "No rejected requests"}
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
                      <span className="inline-block rounded bg-red/10 px-2 py-1 text-xs font-medium text-red">
                        {typeLabels[req.type] || req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                      {renderPayload(req.type, req.payload)}
                    </td>
                    <td className="px-4 py-3 text-red-500 font-medium">
                      {req.rejectionReason}
                    </td>
                    <td className="px-4 py-3 text-dark-4 dark:text-dark-6">
                      {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
