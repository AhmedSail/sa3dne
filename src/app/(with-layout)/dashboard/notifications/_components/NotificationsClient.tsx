"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useLanguage } from "@/lib/i18n/language-context";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  status: "unread" | "read";
  createdAt: string | Date;
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [busy, setBusy] = useState(false);

  const unreadCount = items.filter((n) => n.status === "unread").length;
  const visible = items.filter((n) =>
    filter === "all" ? true : n.status === filter,
  );

  async function markRead(id: string) {
    // Optimistic update.
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)),
    );
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok && res.status !== 404) throw new Error();
    } catch {
      toast.error(t("error"));
      setItems(initialNotifications);
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    setBusy(true);
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, status: "read" as const })));
    try {
      const res = await fetch(`/api/notifications/read-all`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error(t("error"));
      setItems(snapshot);
    } finally {
      setBusy(false);
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-md px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-primary text-white"
        : "bg-gray-2 text-dark hover:bg-gray-3 dark:bg-dark-2 dark:text-white"
    }`;

  return (
    <>
      <Breadcrumb pageName={t("notifications")} />

      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button className={tabClass(filter === "all")} onClick={() => setFilter("all")}>
              {t("all")}
            </button>
            <button
              className={tabClass(filter === "unread")}
              onClick={() => setFilter("unread")}
            >
              {t("unread")}
              {unreadCount > 0 && (
                <span className="ms-2 rounded-full bg-white/25 px-2 py-0.5 text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className={tabClass(filter === "read")}
              onClick={() => setFilter("read")}
            >
              {t("read")}
            </button>
          </div>

          <button
            onClick={markAllRead}
            disabled={busy || unreadCount === 0}
            className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("markAllRead")}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="py-12 text-center text-dark-4 dark:text-dark-6">
            {t("noNotifications")}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((n) => {
              const body = (
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 transition ${
                    n.status === "unread"
                      ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                      : "border-stroke bg-white dark:border-dark-3 dark:bg-dark-2"
                  }`}
                >
                  <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                      n.status === "unread" ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-dark dark:text-white">
                        {n.title}
                      </strong>
                      <span
                        className="text-xs text-dark-4 dark:text-dark-6"
                        dir="ltr"
                      >
                        {dayjs(n.createdAt)
                          .locale(language === "ar" ? "ar" : "en")
                          .format("YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
                      {n.message}
                    </p>
                    {n.status === "unread" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markRead(n.id);
                        }}
                        className="mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        {t("markRead")}
                      </button>
                    )}
                  </div>
                </div>
              );

              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => markRead(n.id)}>
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
