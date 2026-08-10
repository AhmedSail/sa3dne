"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { updateContactSettings } from "@/lib/actions/settings";

export interface ContactSettingsData {
  whatsapp: string | null;
  email: string | null;
  phone: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  address: string | null;
}

export function ContactSettingsForm({ initialData }: { initialData: ContactSettingsData }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ContactSettingsData>({
    whatsapp: initialData.whatsapp || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    facebook: initialData.facebook || "",
    twitter: initialData.twitter || "",
    instagram: initialData.instagram || "",
    linkedin: initialData.linkedin || "",
    address: initialData.address || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatePromise = updateContactSettings(formData);

      toast.promise(updatePromise, {
        loading: t("savingSettings"),
        success: (data) => {
          if (data.error) throw new Error(data.error);
          return t("settingsSaved");
        },
        error: (err) => err.message || t("settingsSaveFailed"),
      });

      await updatePromise;
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShowcaseSection title={t("contactSettingsTitle")} className="p-7!">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* WhatsApp */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("whatsappNumberLabel")}
            </label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp || ""}
              onChange={handleInputChange}
              placeholder={t("whatsappNumberPlaceholder")}
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("emailAddress")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              placeholder={t("emailExamplePlaceholder")}
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("phone")}
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
              placeholder={t("phoneExamplePlaceholder")}
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>
          
          {/* Facebook */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("facebookUrlLabel")}
            </label>
            <input
              type="text"
              name="facebook"
              value={formData.facebook || ""}
              onChange={handleInputChange}
              placeholder="https://facebook.com/..."
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>

          {/* Twitter / X */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("twitterUrlLabel")}
            </label>
            <input
              type="text"
              name="twitter"
              value={formData.twitter || ""}
              onChange={handleInputChange}
              placeholder="https://x.com/..."
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("instagramUrlLabel")}
            </label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram || ""}
              onChange={handleInputChange}
              placeholder="https://instagram.com/..."
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              {t("linkedinUrlLabel")}
            </label>
            <input
              type="text"
              name="linkedin"
              value={formData.linkedin || ""}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
            {t("addressLabel")}
          </label>
          <textarea
            name="address"
            value={formData.address || ""}
            onChange={handleInputChange}
            placeholder={t("addressPlaceholder")}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-sm outline-none transition focus:border-[#10b981] active:border-[#10b981] dark:border-white/10 dark:focus:border-[#10b981]"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex justify-center rounded-xl bg-[#10b981] px-8 py-3 text-sm font-medium text-white hover:bg-[#059669] disabled:opacity-50"
          >
            {isLoading ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}
