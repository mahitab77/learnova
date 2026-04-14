"use client";

/**
 * Parent Dashboard – Messages Component
 * =====================================
 * Displays announcements and notifications for authenticated parents.
 * 
 * Features:
 * ✅ Session-based authentication via useSession()
 * ✅ Dual-panel layout (announcements + notifications)
 * ✅ Real-time unread count tracking
 * ✅ Multi-language support (English/Arabic)
 * ✅ Error handling with auth differentiation
 * ✅ Loading states with skeletons
 * 
 * API Endpoints Used:
 * - GET    /parent/announcements     - Fetch announcements
 * - GET    /parent/notifications     - Fetch notifications inbox
 * - PATCH  /parent/notifications/:id/read - Mark single notification read
 * - PATCH  /parent/notifications/read-all  - Mark all notifications read
 * 
 * Authentication:
 * - Uses session cookie (credentials: "include")
 * - Hook errors return "NOT_AUTHENTICATED" for auth failures
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, Megaphone, RefreshCcw } from "lucide-react";

import { useSession } from "@/src/hooks/useSession";
import { parentDashboardTexts } from "../parentDashboardTexts";
import { useParentAnnouncements, useParentNotifications } from "../parentDashboardHooks";

// Type aliases for better readability
type Language = "en" | "ar";

function ParentDashboardMessagesPageContent() {
  // ==========================================================================
  // 1. LANGUAGE & DIRECTION SETUP
  // ==========================================================================
  const searchParams = useSearchParams();
  const lang: Language = searchParams.get("lang") === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";
  
  // Translations object (used throughout component)
  const t = parentDashboardTexts[lang];

  // ==========================================================================
  // 2. AUTHENTICATION
  // ==========================================================================
  const { loading: sessionLoading, authenticated } = useSession();

  // ==========================================================================
  // 3. DATA HOOKS
  // ==========================================================================
  // Announcements data
  const {
    announcements,
    loading: announcementsLoading,
    error: announcementsError,
    refresh: refreshAnnouncements,
  } = useParentAnnouncements();

  // Notifications data
  const {
    inbox,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
    markRead,
    markAllRead,
  } = useParentNotifications();

  // ==========================================================================
  // 4. DERIVED STATES
  // ==========================================================================
  /**
   * Authentication state check
   * True if:
   * - Session is loaded AND
   * - User is not authenticated OR
   * - Any hook returned NOT_AUTHENTICATED error
   */
  const notAuthed =
    !sessionLoading &&
    (!authenticated ||
      announcementsError === "NOT_AUTHENTICATED" ||
      notificationsError === "NOT_AUTHENTICATED");

  /**
   * Combined loading state
   * Show loading skeleton if any data is loading
   */
  const anyLoading = sessionLoading || announcementsLoading || notificationsLoading;

  /**
   * Non-authentication errors
   * These are actual data/network errors, not auth failures
   */
  const nonAuthError =
    announcementsError && announcementsError !== "NOT_AUTHENTICATED"
      ? announcementsError
      : notificationsError && notificationsError !== "NOT_AUTHENTICATED"
      ? notificationsError
      : null;

  /**
   * Unread notifications count
   * Memoized to prevent unnecessary re-renders
   */
  const unreadCount = useMemo(() => inbox.unreadCount ?? 0, [inbox.unreadCount]);

  // ==========================================================================
  // 5. RENDER UTILITIES
  // ==========================================================================
  /**
   * Format date according to language locale
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = lang === "ar" ? "ar-EG" : "en-GB";
    return date.toLocaleString(locale);
  };

  // ==========================================================================
  // 6. RENDER COMPONENT
  // ==========================================================================
  return (
    <div className="space-y-6" dir={dir}>
      {/* ======================================================================
          HEADER SECTION
          Shows title, description, unread count, and error states
      ====================================================================== */}
      <header className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {t.navMessages}
            </h1>
            <p className="text-sm text-slate-500">
              {lang === "ar" ? "الإعلانات والإشعارات" : "Announcements and notifications"}
            </p>
          </div>

          {/* Unread counter */}
          <div className="text-sm text-slate-600">
            {lang === "ar" ? `غير مقروء: ${unreadCount}` : `Unread: ${unreadCount}`}
          </div>
        </div>

        {/* Authentication error */}
        {notAuthed && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
            {lang === "ar" 
              ? "يجب تسجيل الدخول كولي أمر." 
              : "You must be logged in as a parent."}
          </div>
        )}

        {/* Non-auth error (network, server, etc.) */}
        {!notAuthed && nonAuthError && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            {nonAuthError}
          </div>
        )}
      </header>

      {/* ======================================================================
          LOADING STATE
          Shows skeleton loader while data is fetching
      ====================================================================== */}
      {anyLoading && !notAuthed && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-white/70 shadow-sm ring-1 ring-slate-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/70 shadow-sm ring-1 ring-slate-100" />
        </section>
      )}

      {/* ======================================================================
          MAIN CONTENT
          Shows announcements and notifications panels
      ====================================================================== */}
      {!anyLoading && !notAuthed && (
        <section className="grid gap-4 lg:grid-cols-2">
          {/* ----------------------------------------------------------------
              ANNOUNCEMENTS PANEL
          ---------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {/* Panel header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-semibold text-slate-800">
                  {lang === "ar" ? "الإعلانات" : "Announcements"}
                </h2>
              </div>

              {/* Refresh button */}
              <button
                onClick={() => void refreshAnnouncements()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                aria-label={lang === "ar" ? "تحديث الإعلانات" : "Refresh announcements"}
              >
                <RefreshCcw className="h-4 w-4" />
                {lang === "ar" ? "تحديث" : "Refresh"}
              </button>
            </div>

            {/* Announcements list */}
            {announcements.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                {lang === "ar" ? "لا توجد إعلانات حالياً." : "No announcements yet."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {announcements.map((announcement) => (
                  <li
                    key={announcement.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{announcement.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {announcement.body}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(announcement.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ----------------------------------------------------------------
              NOTIFICATIONS PANEL
          ---------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {/* Panel header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-sky-600" />
                <h2 className="text-base font-semibold text-slate-800">
                  {lang === "ar" ? "الإشعارات" : "Notifications"}
                </h2>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void refreshNotifications()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  aria-label={lang === "ar" ? "تحديث الإشعارات" : "Refresh notifications"}
                >
                  <RefreshCcw className="h-4 w-4" />
                  {lang === "ar" ? "تحديث" : "Refresh"}
                </button>

                <button
                  onClick={() => void markAllRead()}
                  disabled={unreadCount === 0}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                  aria-label={lang === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}
                >
                  {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
                </button>
              </div>
            </div>

            {/* Notifications list */}
            {inbox.items.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                {lang === "ar" ? "لا توجد إشعارات." : "No notifications."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {inbox.items.map((notification) => (
                  <li
                    key={notification.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Notification content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">
                          {notification.title}
                          {/* New badge */}
                          {!notification.isRead && (
                            <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs text-amber-900">
                              {lang === "ar" ? "جديد" : "New"}
                            </span>
                          )}
                        </p>

                        <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                          {notification.body}
                        </p>

                        {/* Timestamp */}
                        {notification.createdAt && (
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDate(notification.createdAt)}
                          </p>
                        )}
                      </div>

                      {/* Mark as read button */}
                      <button
                        onClick={() => void markRead(notification.id)}
                        disabled={notification.isRead}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        aria-label={
                          notification.isRead
                            ? (lang === "ar" ? "مقروء" : "Already read")
                            : (lang === "ar" ? "تحديد كمقروء" : "Mark as read")
                        }
                      >
                        {notification.isRead
                          ? (lang === "ar" ? "مقروء" : "Read")
                          : (lang === "ar" ? "تحديد كمقروء" : "Mark read")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ParentDashboardMessagesPageFallback() {
  return <div className="space-y-6"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

export default function ParentDashboardMessagesPage() {
  return (
    <Suspense fallback={<ParentDashboardMessagesPageFallback />}>
      <ParentDashboardMessagesPageContent />
    </Suspense>
  );
}