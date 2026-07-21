"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { Suspense } from "react";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <SigninWithPassword />
    </Suspense>
  );
}
