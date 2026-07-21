import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Metadata } from "next";
import { getContactSettings } from "@/lib/actions/settings";
import { ContactSettingsForm } from "./_components/contact-settings-form";

export const metadata: Metadata = {
  title: "إعدادات التواصل | لوحة التحكم",
};

export default async function ContactSettingsPage() {
  const settings = await getContactSettings();

  return (
    <div className="mx-auto w-full max-w-270">
      <Breadcrumb pageName="إعدادات التواصل" />

      <div className="grid grid-cols-1 gap-8">
        <div className="col-span-1">
          <ContactSettingsForm initialData={settings} />
        </div>
      </div>
    </div>
  );
}
