"use client";

import { useLanguage } from "@/lib/i18n/language-context";

/**
 * Localised title/subtitle for the sign-in and sign-up pages. Those pages are
 * server components, so the translated headings live in this small client
 * island rather than being hardcoded in a single language.
 */
export function AuthPageHeading({
  type,
  withSubtitle = false,
}: {
  type: "signin" | "signup";
  withSubtitle?: boolean;
}) {
  const { t } = useLanguage();

  const titleKey = type === "signin" ? "authSignInTitle" : "authSignUpTitle";
  const subtitleKey =
    type === "signin" ? "authSignInSubtitle" : "authSignUpSubtitle";

  return (
    <>
      <h1 className="text-2xl font-bold text-dark dark:text-white sm:text-3xl">
        {t(titleKey)}
      </h1>
      {withSubtitle && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t(subtitleKey)}
        </p>
      )}
    </>
  );
}
