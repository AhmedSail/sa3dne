"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { Suspense } from "react";
import SignupWithPassword from "../SignupWithPassword";

export default function Signup() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <div className="my-6 flex items-center justify-center">
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
        <div className="block w-full min-w-fit bg-white px-3 text-center font-medium dark:bg-gray-dark">
          {t("orSignUpWith")}
        </div>
        <span className="block h-px w-full bg-stroke dark:bg-dark-3"></span>
      </div>

      <div>
        <SignupWithPassword />
      </div>
    </Suspense>
  );
}
