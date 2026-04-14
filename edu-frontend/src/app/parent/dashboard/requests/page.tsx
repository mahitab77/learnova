"use client";
/**
 * Parent Dashboard – Requests Tab (SESSION AUTH) — UPDATED
 * -----------------------------------------------------------------------------
 * ✅ Session-cookie auth only (NO x-user-id)
 * ✅ Shows BOTH current + requested teacher (from updated backend)
 * ✅ Keeps this tab READ-ONLY (view statuses only) as you requested
 * ✅ Graceful states: loading / auth / error / empty
 *
 * Backend expected fields (from GET /parent/requests):
 * - currentTeacherName (or current_teacher_name depending on your normalizer)
 * - requestedTeacherName (or requested_teacher_name)
 *
 * NOTE:
 * - This UI assumes your `useParentRequests()` hook maps backend snake_case
 *   to camelCase fields used below. If your hook still returns old keys,
 *   update the hook normalizer accordingly (I can do that next).
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, FileText, ArrowRightLeft, UserRound } from "lucide-react";

import { parentDashboardTexts } from "../parentDashboardTexts";
import { useParentRequests } from "../parentDashboardHooks";
import { useSession } from "@/src/hooks/useSession";

function ParentRequestsPageContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = parentDashboardTexts[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // ---------------------------------------------------------------------------
  // Session gate (same pattern you use across dashboards)
  // ---------------------------------------------------------------------------
  const { loading: sessionLoading, authenticated } = useSession();

  // ---------------------------------------------------------------------------
  // Data hook (session-based: credentials include inside the hook)
  // ---------------------------------------------------------------------------
  const { requests, loading, error } = useParentRequests();

  const notAuthed =
    !sessionLoading && (!authenticated || error === "NOT_AUTHENTICATED");

  // ---------------------------------------------------------------------------
  // Status badge styles
  // ---------------------------------------------------------------------------
  const statusColors: Record<string, string> = useMemo(
    () => ({
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    }),
    []
  );

  // ---------------------------------------------------------------------------
  // Small helper for a user-friendly teacher label
  // ---------------------------------------------------------------------------
  const teacherLabel = (name?: string | null) => {
    const safe = typeof name === "string" ? name.trim() : "";
    return safe ? safe : lang === "ar" ? "غير محدد" : "Not set";
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* =========================================================================
       * Header
       * ========================================================================= */}
      <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {t.requestsTitle}
        </h1>
        <p className="text-sm text-slate-500">{t.requestsSubtitle}</p>

        {/* Auth banner */}
        {notAuthed && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
            {lang === "ar"
              ? "يجب تسجيل الدخول كولي أمر."
              : "You must be logged in as a parent."}
          </div>
        )}
      </header>

      {/* =========================================================================
       * Content
       * ========================================================================= */}
      <section className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        {/* Loading */}
        {(sessionLoading || loading) && !notAuthed && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            {lang === "ar" ? "جاري تحميل الطلبات..." : "Loading requests..."}
          </p>
        )}

        {/* Error (non-auth only) */}
        {!notAuthed && error && error !== "NOT_AUTHENTICATED" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t.loadError}
          </div>
        )}

        {/* Empty */}
        {!sessionLoading && !loading && !notAuthed && requests.length === 0 && (
          <p className="text-sm text-slate-500">{t.requestsEmpty}</p>
        )}

        {/* Data */}
        {!sessionLoading && !loading && !notAuthed && requests.length > 0 && (
          <ul className="space-y-3">
            {requests.map((r) => {
              const statusKey = String(r.status || "").toLowerCase();
              const badgeClass =
                statusColors[statusKey] || "bg-slate-100 text-slate-600";

              // These are the NEW fields you added via backend:
              // - currentTeacherName
              // - requestedTeacherName
              //
              // If your hook returns snake_case, adjust the hook normalizer.
              const currentTeacher = teacherLabel(
                // @ts-expect-error: some projects normalize keys differently
                r.currentTeacherName ?? r.current_teacher_name ?? null
              );
              const requestedTeacher = teacherLabel(
                // @ts-expect-error: some projects normalize keys differently
                r.requestedTeacherName ?? r.requested_teacher_name ?? null
              );

              const hasTeacherDiff =
                currentTeacher !== (lang === "ar" ? "غير محدد" : "Not set") &&
                requestedTeacher !== (lang === "ar" ? "غير محدد" : "Not set");

              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3 shadow-sm"
                >
                  {/* Top row: student + subject + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {r.studentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {lang === "ar"
                            ? r.subjectNameAr || "بدون مادة"
                            : r.subjectNameEn || "No Subject"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                    >
                      {statusKey === "pending"
                        ? t.requestsStatusPending
                        : statusKey === "approved"
                        ? t.requestsStatusApproved
                        : t.requestsStatusRejected}
                    </span>
                  </div>

                  {/* Teacher change summary (NEW) */}
                  <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <UserRound className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">
                        {lang === "ar" ? "المعلم" : "Teacher"}
                      </span>
                    </div>

                    {/* If we have both, show "Current → Requested" */}
                    {hasTeacherDiff ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {lang === "ar" ? `الحالي: ${currentTeacher}` : `Current: ${currentTeacher}`}
                        </span>

                        <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />

                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                          {lang === "ar"
                            ? `المطلوب: ${requestedTeacher}`
                            : `Requested: ${requestedTeacher}`}
                        </span>
                      </div>
                    ) : (
                      // Otherwise show whatever is available (current or requested)
                      <p className="mt-1 text-xs text-slate-600">
                        {lang === "ar"
                          ? `الحالي: ${currentTeacher} • المطلوب: ${requestedTeacher}`
                          : `Current: ${currentTeacher} • Requested: ${requestedTeacher}`}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  {r.reason && (
                    <p className="mt-2 text-xs text-slate-500">
                      {t.requestsReason}: {r.reason}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {t.requestsCreatedAt}:{" "}
                    {new Date(r.createdAt).toLocaleString(
                      lang === "ar" ? "ar-EG" : "en-GB"
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ParentRequestsPageFallback() {
  return <div className="space-y-6"><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

export default function ParentRequestsPage() {
  return (
    <Suspense fallback={<ParentRequestsPageFallback />}>
      <ParentRequestsPageContent />
    </Suspense>
  );
}
