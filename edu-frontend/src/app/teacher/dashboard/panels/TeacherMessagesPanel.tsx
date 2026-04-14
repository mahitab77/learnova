"use client";

/**
 * MessagesPanel (Teacher) — DROP-IN (NO FEATURE LOSS)
 * -----------------------------------------------------------------------------
 * One panel with internal tabs:
 *  - Announcements (admin broadcast) ✅ read-only
 *  - Notifications (teacher inbox)   ✅ mark read / mark all read
 *
 * ✅ Uses shared types from teacherDashboardTypes.ts (prevents type drift)
 * ✅ Handles null dates safely
 * ✅ RTL/LTR safe
 * ✅ No `any`
 *
 * NOTE ABOUT CASING:
 * - This panel expects teacher messages endpoints return camelCase:
 *   - announcement.createdAt
 *   - notification.isRead / relatedType / relatedId / createdAt
 * If your backend returns snake_case instead, DON'T hack here — fix the mapping in hook.
 */

import { useMemo, useState } from "react";
import type {
  Lang,
  TeacherAnnouncementRow,
  TeacherNotificationInbox,
  TeacherNotificationRow,
} from "../teacherDashboardTypes";

import type { TeacherDashboardLanguagePack } from "../teacherDashboardTexts";

import { teacherTypeUtils } from "../teacherDashboardTypes";
import { Check, CheckCheck, Megaphone, Bell, RefreshCw } from "lucide-react";

type Props = {
  lang: Lang;
  t: TeacherDashboardLanguagePack;

  // Announcements
  announcements: TeacherAnnouncementRow[];
  announcementsLoading: boolean;
  announcementsError: string | null;
  onRefreshAnnouncements: () => void;

  // Notifications
  inbox: TeacherNotificationInbox;
  notificationsLoading: boolean;
  notificationsError: string | null;
  onRefreshNotifications: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
};

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatDateMaybe(iso: string | null, lang: Lang): string {
  if (!iso) return "—";
  return teacherTypeUtils.formatDate(iso, lang);
}

export default function MessagesPanel(props: Props) {
  const {
    lang,
    t,

    announcements,
    announcementsLoading,
    announcementsError,
    onRefreshAnnouncements,

    inbox,
    notificationsLoading,
    notificationsError,
    onRefreshNotifications,
    onMarkRead,
    onMarkAllRead,
  } = props;

  const dir = lang === "ar" ? "rtl" : "ltr";
  const [active, setActive] = useState<"announcements" | "notifications">(
    "announcements"
  );

  // Prefer backend-provided unreadCount; fallback to compute.
  const unreadCount = useMemo(() => {
    if (typeof inbox?.unreadCount === "number") return inbox.unreadCount;
    const items = Array.isArray(inbox?.items) ? inbox.items : [];
    return items.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);
  }, [inbox]);

  const announcementsHasItems = announcements.length > 0;
  const notificationsHasItems = inbox.items.length > 0;

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {t.messages.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t.messages.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (active === "announcements") onRefreshAnnouncements();
              else onRefreshNotifications();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t.common.refresh}
          </button>

          {active === "notifications" && (
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                unreadCount === 0
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              ].join(" ")}
            >
              <CheckCheck className="h-4 w-4" />
              {t.messages.markAllRead}
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <button
          type="button"
          onClick={() => setActive("announcements")}
          className={[
            "flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
            active === "announcements"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          <Megaphone className="h-4 w-4" />
          {t.messages.tabAnnouncements}
        </button>

        <button
          type="button"
          onClick={() => setActive("notifications")}
          className={[
            "flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
            active === "notifications"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          <Bell className="h-4 w-4" />
          {t.messages.tabNotifications}
          <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
            {unreadCount}
          </span>
        </button>
      </div>

      {/* ========================= ANNOUNCEMENTS ========================= */}
      {active === "announcements" && (
        <div className="space-y-3">
          {announcementsError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {announcementsError}
            </div>
          )}

          {announcementsLoading && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              {t.common.loading}
            </div>
          )}

          {!announcementsLoading &&
            !announcementsHasItems &&
            !announcementsError && (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                {t.messages.announcementsEmpty}
              </div>
            )}

          {!announcementsLoading && announcementsHasItems && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {announcements.map((a: TeacherAnnouncementRow) => {
                  const created = formatDateMaybe(a.createdAt, lang);

                  return (
                    <li key={a.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-slate-900">
                              {safeText(a.title) ||
                                (lang === "ar" ? "إعلان" : "Announcement")}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {created}
                            </span>
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                            {a.body || "—"}
                          </p>

                          <div className="mt-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">
                              {lang === "ar" ? "الجمهور" : "Audience"}:{" "}
                              {a.audience}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ========================= NOTIFICATIONS ========================= */}
      {active === "notifications" && (
        <div className="space-y-3">
          {notificationsError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {notificationsError}
            </div>
          )}

          {notificationsLoading && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              {t.common.loading}
            </div>
          )}

          {!notificationsLoading &&
            !notificationsHasItems &&
            !notificationsError && (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                {t.messages.notificationsEmpty}
              </div>
            )}

          {!notificationsLoading && notificationsHasItems && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {inbox.items.map((n: TeacherNotificationRow) => {
                  const isRead = Boolean(n.isRead);
                  const created = formatDateMaybe(n.createdAt, lang);

                  return (
                    <li key={n.id} className="p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "h-2 w-2 rounded-full",
                                isRead ? "bg-slate-300" : "bg-emerald-500",
                              ].join(" ")}
                              aria-hidden="true"
                            />

                            <h3 className="truncate font-semibold text-slate-900">
                              {safeText(n.title) ||
                                (lang === "ar" ? "إشعار" : "Notification")}
                            </h3>

                            <span className="text-xs text-slate-500">
                              {created}
                            </span>
                          </div>

                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                            {n.body ?? "—"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">
                              {t.messages.typeLabel}: {safeText(n.type) || "—"}
                            </span>

                            {n.relatedType && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {t.messages.relatedLabel}: {n.relatedType}
                                {typeof n.relatedId === "number"
                                  ? ` #${n.relatedId}`
                                  : ""}
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
                                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                            ].join(" ")}
                          >
                            <Check className="h-4 w-4" />
                            {t.messages.markRead}
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
      )}
    </div>
  );
}
