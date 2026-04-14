// src/app/admin/dashboard/components/NotificationsPanel.tsx
"use client";

/**
 * NotificationsPanel (Admin Inbox) — DROP-IN REPLACEMENT
 * -----------------------------------------------------------------------------
 * Fixes:
 * ✅ Uses shared types from adminTypes.ts (prevents duplicate-type mismatch)
 * ✅ Handles created_at being string | null safely
 * ✅ RTL/LTR safe layout
 * ✅ No `any`
 */

import { useMemo } from "react";
import { adminTypeUtils } from "../adminTypes";
import type { Lang, NotificationInbox, NotificationRow } from "../adminTypes";

import type { LangTexts } from "../adminTexts";

import { Check, CheckCheck, RefreshCw } from "lucide-react";

type Props = {
  lang: Lang;
  t: LangTexts;

  inbox: NotificationInbox;
  loading: boolean;
  error: string | null;

  onRefresh: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
};

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function formatDateMaybe(iso: string | null, lang: Lang): string {
  if (!iso) return "—";
  return adminTypeUtils.formatDate(iso, lang);
}

export default function NotificationsPanel({
  lang,
  inbox,
  loading,
  error,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  const unreadCount = useMemo(() => {
    // Prefer inbox.unreadCount but stay defensive
    if (typeof inbox.unreadCount === "number") return inbox.unreadCount;
    return inbox.items.reduce((acc, n) => acc + (adminTypeUtils.normalizeIsRead(n.is_read) ? 0 : 1), 0);
  }, [inbox]);

  const hasItems = inbox.items.length > 0;

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {lang === "ar" ? "الإشعارات" : "Notifications"}
            </h2>

            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {lang === "ar" ? `غير مقروء: ${unreadCount}` : `Unread: ${unreadCount}`}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-600">
            {lang === "ar"
              ? "صندوق وارد إشعارات المدير (للمتابعة فقط)."
              : "Admin notifications inbox (read-only monitoring)."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </button>

          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              unreadCount === 0
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700",
            ].join(" ")}
          >
            <CheckCheck className="h-4 w-4" />
            {lang === "ar" ? "تعليم الكل كمقروء" : "Mark all read"}
          </button>
        </div>
      </div>

      {/* Status */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          {lang === "ar" ? "جاري تحميل الإشعارات..." : "Loading notifications..."}
        </div>
      )}

      {!loading && !hasItems && !error && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          {lang === "ar" ? "لا توجد إشعارات حالياً." : "No notifications yet."}
        </div>
      )}

      {/* List */}
      {!loading && hasItems && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {inbox.items.map((n: NotificationRow) => {
              const isRead = adminTypeUtils.normalizeIsRead(n.is_read);
              const created = formatDateMaybe(n.created_at, lang);

              return (
                <li key={n.id} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            isRead ? "bg-slate-300" : "bg-emerald-500",
                          ].join(" ")}
                          aria-hidden="true"
                        />

                        <h3 className="font-semibold text-slate-900 truncate">
                          {safeText(n.title) || (lang === "ar" ? "إشعار" : "Notification")}
                        </h3>

                        <span className="text-xs text-slate-500">{created}</span>
                      </div>

                      <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                        {n.body ?? "—"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {lang === "ar" ? "النوع" : "Type"}: {safeText(n.type) || "—"}
                        </span>

                        {n.related_type && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            {lang === "ar" ? "مرتبط بـ" : "Related"}: {n.related_type}
                            {typeof n.related_id === "number" ? ` #${n.related_id}` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onMarkRead(n.id)}
                        disabled={isRead}
                        className={[
                          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                          isRead
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        ].join(" ")}
                      >
                        <Check className="h-4 w-4" />
                        {lang === "ar" ? "تعليم كمقروء" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
