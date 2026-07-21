"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BellIcon } from "./icons";
import { useLanguage } from "@/lib/i18n/language-context";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  status: "unread" | "read";
  createdAt: string;
}

const POLL_INTERVAL_MS = 60_000;

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();
  const { t, dir } = useLanguage();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=6", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silent — the bell simply shows no new items.
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // Ignore — next poll reconciles state.
    }
  }, []);

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);
        if (open) load();
      }}
    >
      <DropdownTrigger
        className="grid size-12 cursor-pointer place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? (dir === "rtl" ? "start" : "end") : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md min-[350px]:min-w-[20rem] dark:border-dark-3 dark:bg-gray-dark"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            {t("notifications")}
          </span>
          {unreadCount > 0 && (
            <span className="rounded-md bg-primary px-2.25 py-0.5 text-xs font-medium text-white">
              {unreadCount} {t("newBadge")}
            </span>
          )}
        </div>

        <ul className="mb-3 max-h-92 space-y-1.5 overflow-y-auto">
          {items.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-dark-4 dark:text-dark-6">
              {t("noNotifications")}
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id} role="menuitem">
                <Link
                  href={item.link ?? "/dashboard/notifications"}
                  onClick={() => {
                    setIsOpen(false);
                    if (item.status === "unread") markRead(item.id);
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-2 py-2 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                    item.status === "unread" && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.status === "unread" ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-medium text-dark dark:text-white">
                      {item.title}
                    </strong>
                    <span className="block truncate text-sm text-dark-5 dark:text-dark-6">
                      {item.message}
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>

        <Link
          href="/dashboard/notifications"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary transition-colors outline-none hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          {t("seeAllNotifications")}
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
