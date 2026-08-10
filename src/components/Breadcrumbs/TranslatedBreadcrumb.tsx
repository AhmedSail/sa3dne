"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Breadcrumb from "./Breadcrumb";

/**
 * Breadcrumb for server-rendered pages: takes a translation key instead of a
 * literal title, so the heading follows the language the user selected.
 */
export default function TranslatedBreadcrumb({
  pageNameKey,
}: {
  pageNameKey: string;
}) {
  const { t } = useLanguage();
  return <Breadcrumb pageName={t(pageNameKey)} />;
}
