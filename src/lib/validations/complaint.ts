import { z } from "zod";

export const submitComplaintSchema = z.object({
  campId: z.string().min(1, "الرجاء اختيار المخيم"),
  type: z.enum(["complaint", "suggestion", "unmet_need"], {
    message: "الرجاء اختيار نوع الرسالة",
  }),
  beneficiaryName: z.string().min(2, "الاسم يجب أن يكون أكثر من حرفين"),
  phone: z.string().optional(),
  details: z.string().min(10, "التفاصيل يجب أن تكون أكثر من 10 حروف"),
});

export const trackComplaintSchema = z.object({
  trackingNumber: z.string().min(1, "الرجاء إدخال رقم التتبع"),
});

export const updateComplaintSchema = z
  .object({
    status: z.enum(["pending", "in_review", "resolved", "rejected"]),
    resolutionNotes: z.string().optional(),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "resolved") {
        return !!data.resolutionNotes && data.resolutionNotes.length > 0;
      }
      return true;
    },
    {
      message: "ملاحظات الحل مطلوبة عند تعيين الحالة كـ 'تم الحل'",
      path: ["resolutionNotes"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "rejected") {
        return !!data.rejectionReason && data.rejectionReason.length > 0;
      }
      return true;
    },
    {
      message: "سبب الرفض مطلوب عند تعيين الحالة كـ 'مرفوض'",
      path: ["rejectionReason"],
    }
  );
