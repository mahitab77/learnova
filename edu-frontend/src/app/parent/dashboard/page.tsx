"use client";

/**
 * Parent Dashboard – Overview Tab (SESSION AUTH VERSION)
 * ----------------------------------------------------------------
 * Responsibilities:
 *  - Show general statistics: total children, assignments, requests.
 *  - Display recent activity (latest submissions or requests).
 *  - Session-based auth (cookie) via useSession()
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, ClipboardList, FileText, LayoutDashboard, Users } from "lucide-react";

import { parentDashboardTexts } from "./parentDashboardTexts";
import { useSession } from "@/src/hooks/useSession";

import {
  useParentStudents,
  useParentAssignments,
  useParentRequests,
} from "./parentDashboardHooks";

function ParentDashboardOverviewContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = parentDashboardTexts[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // ✅ Session auth gate (same idea as student dashboard)
  const { loading: sessionLoading, authenticated } = useSession();

  // ✅ Data fetching (session-based hooks)
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
  } = useParentStudents();

  const {
    assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useParentAssignments();

  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
  } = useParentRequests();

  // ✅ Unified auth error detection
  const notAuthed =
    !sessionLoading &&
    (!authenticated ||
      studentsError === "NOT_AUTHENTICATED" ||
      assignmentsError === "NOT_AUTHENTICATED" ||
      requestsError === "NOT_AUTHENTICATED");

  const anyLoading =
    sessionLoading || studentsLoading || assignmentsLoading || requestsLoading;

  // ✅ Show non-auth errors (but avoid showing NOT_AUTHENTICATED as a raw string)
  const nonAuthError =
    studentsError && studentsError !== "NOT_AUTHENTICATED"
      ? studentsError
      : assignmentsError && assignmentsError !== "NOT_AUTHENTICATED"
      ? assignmentsError
      : requestsError && requestsError !== "NOT_AUTHENTICATED"
      ? requestsError
      : null;

  /* ------------------------------------------------------------------------ */
  /* Derived data: recent activity                                            */
  /* ------------------------------------------------------------------------ */
  const recentActivity = useMemo(() => {
    const activity: {
      id: string;
      type: "assignment" | "request";
      title: string;
      timestamp: string;
    }[] = [];

    assignments.forEach((a) => {
      const ts = a.submittedAt || a.dueAt;
      if (ts) {
        activity.push({
          id: `a-${a.id}`,
          type: "assignment",
          title: a.title,
          timestamp: ts,
        });
      }
    });

    requests.forEach((r) =>
      activity.push({
        id: `r-${r.id}`,
        type: "request",
        title: r.studentName,
        timestamp: r.createdAt,
      })
    );

    return activity
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 5);
  }, [assignments, requests]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="space-y-6" dir={dir}>
      {/* Header card */}
      <header className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{t.overviewTitle}</h1>
            <p className="text-sm text-slate-500">{t.overviewSubtitle}</p>
          </div>
        </div>

        {/* Auth / Errors */}
        {notAuthed && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
            {lang === "ar" ? "يجب تسجيل الدخول كولي أمر." : "You must be logged in as a parent."}
          </div>
        )}

        {!notAuthed && nonAuthError && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            {nonAuthError}
          </div>
        )}
      </header>

      {/* Loading skeleton */}
      {anyLoading && !notAuthed && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-xl bg-white/70 shadow-sm ring-1 ring-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-white/70 shadow-sm ring-1 ring-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-white/70 shadow-sm ring-1 ring-slate-100" />
        </section>
      )}

      {/* Stats grid */}
      {!anyLoading && !notAuthed && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-linear-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm">{t.overviewTotalChildren}</p>
              <Users className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-2 text-2xl font-bold">{students.length}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-linear-to-br from-sky-500 to-sky-600 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm">{t.overviewTotalAssignments}</p>
              <ClipboardList className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-2 text-2xl font-bold">{assignments.length}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-linear-to-br from-amber-500 to-orange-600 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm">{t.overviewTotalRequests}</p>
              <FileText className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-2 text-2xl font-bold">{requests.length}</p>
          </div>
        </section>
      )}

      {/* Recent activity */}
      {!anyLoading && !notAuthed && (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-slate-800">
              {t.overviewRecentActivity}
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">{t.overviewNoActivity}</p>
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  {item.type === "assignment" ? (
                    <ClipboardList className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <LayoutDashboard className="h-4 w-4 text-sky-500" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.timestamp).toLocaleString(
                        lang === "ar" ? "ar-EG" : "en-GB"
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function ParentDashboardOverviewFallback() {
  return <div className="space-y-6"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

export default function ParentDashboardOverview() {
  return (
    <Suspense fallback={<ParentDashboardOverviewFallback />}>
      <ParentDashboardOverviewContent />
    </Suspense>
  );
}
