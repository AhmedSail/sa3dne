"use client";

import { useLanguage } from "@/lib/i18n/language-context";

const CONTRIBUTION_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700 dark:bg-dark-3 dark:text-dark-6",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  partially_received: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  not_received: "bg-gray-200 text-gray-600 dark:bg-dark-3 dark:text-dark-6",
};

const LINE_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  received: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  partially_received:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  not_received: "bg-gray-200 text-gray-600 dark:bg-dark-3 dark:text-dark-6",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const CONTRIBUTION_STATUS_KEY: Record<string, string> = {
  draft: "contributionStatusDraft",
  submitted: "contributionStatusSubmitted",
  cancelled: "contributionStatusCancelled",
  completed: "lineStatusReceived",
  partially_received: "lineStatusPartial",
  not_received: "lineStatusNotReceived",
};

const LINE_STATUS_KEY: Record<string, string> = {
  pending: "lineStatusPending",
  received: "lineStatusReceived",
  partially_received: "lineStatusPartial",
  not_received: "lineStatusNotReceived",
  rejected: "lineStatusRejected",
};

export function ContributionStatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const style =
    CONTRIBUTION_STATUS_STYLES[status] ?? CONTRIBUTION_STATUS_STYLES.draft;
  const label = CONTRIBUTION_STATUS_KEY[status]
    ? t(CONTRIBUTION_STATUS_KEY[status] as any)
    : status;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

export function LineStatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const style = LINE_STATUS_STYLES[status] ?? LINE_STATUS_STYLES.pending;
  const label = LINE_STATUS_KEY[status] ? t(LINE_STATUS_KEY[status] as any) : status;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
