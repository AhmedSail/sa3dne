import { z } from "zod";

export const contactSettingsSchema = z.object({
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  facebook: z.string().url("رابط غير صالح").optional().nullable().or(z.literal("")),
  twitter: z.string().url("رابط غير صالح").optional().nullable().or(z.literal("")),
  instagram: z.string().url("رابط غير صالح").optional().nullable().or(z.literal("")),
  linkedin: z.string().url("رابط غير صالح").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
});
