"use client";
/**
 * Parent Dashboard – Assignments Tab (SESSION AUTH)
 * ----------------------------------------------------------------
 * - No x-user-id
 * - Uses session cookie (credentials: include) via hooks
 * - Shows a friendly "not logged in" banner when needed
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ClipboardList } from "lucide-react";

import { parentDashboardTexts } from "../parentDashboardTexts";
import { useParentAssignments } from "../parentDashboardHooks";
import { useSession } from "@/src/hooks/useSession";

import type { ParentAssignment } from "../parentDashboardTypes";

function ParentAssignmentsPageContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = parentDashboardTexts[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  // ✅ Session gate (same pattern as student dashboard)
  const { loading: sessionLoading, authenticated } = useSession();

  // ✅ Session-based hook (no devUserId)
  const { assignments, loading, error } = useParentAssignments();

  const notAuthed =
    !sessionLoading && (!authenticated || error === "NOT_AUTHENTICATED");

  /* ------------------------------------------------------------------------
   * Group assignments by student
   * ---------------------------------------------------------------------- */
  const grouped = assignments.reduce(
    (acc: Record<string, ParentAssignment[]>, a) => {
      const key = a.studentName || (lang === "ar" ? "بدون اسم" : "Unnamed");
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {t.assignmentsTitle}
        </h1>
        <p className="text-sm text-slate-500">{t.assignmentsSubtitle}</p>

        {notAuthed && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
            {lang === "ar"
              ? "يجب تسجيل الدخول كولي أمر."
              : "You must be logged in as a parent."}
          </div>
        )}
      </header>

      {/* Content */}
      <section className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        {/* Loading */}
        {(sessionLoading || loading) && !notAuthed && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            {lang === "ar"
              ? "جاري تحميل الواجبات والاختبارات..."
              : "Loading assignments..."}
          </div>
        )}

        {/* Error (non-auth errors only) */}
        {!notAuthed && error && error !== "NOT_AUTHENTICATED" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t.loadError}
          </div>
        )}

        {/* Empty */}
        {!sessionLoading && !loading && !notAuthed && assignments.length === 0 && (
          <p className="text-sm text-slate-500">{t.assignmentsEmpty}</p>
        )}

        {/* Data */}
        {!sessionLoading && !loading && !notAuthed && assignments.length > 0 && (
          <div className="space-y-8">
            {Object.entries(grouped).map(([studentName, rows]) => (
              <div key={studentName} className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-800">
                    {t.assignmentsStudentLabel}: {studentName}
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.assignmentsTitle}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.assignmentsSubjectLabel}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.assignmentsTypeLabel}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.assignmentsScoreLabel}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.assignmentsDueLabel}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.assignmentsSubmittedLabel}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b last:border-0 transition-colors hover:bg-slate-50"
                        >
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {a.title}
                          </td>

                          <td className="px-3 py-2 text-slate-700">
                            {lang === "ar"
                              ? a.subjectNameAr || "-"
                              : a.subjectNameEn || "-"}
                          </td>

                          <td className="px-3 py-2">
                            {a.type === "quiz"
                              ? t.assignmentsTypeQuiz
                              : t.assignmentsTypeHomework}
                          </td>

                          <td className="px-3 py-2 text-slate-600">
                            {a.score != null && a.maxScore != null
                              ? `${a.score}/${a.maxScore}`
                              : "-"}
                          </td>

                          <td className="px-3 py-2 text-slate-600">
                            {a.dueAt
                              ? new Date(a.dueAt).toLocaleDateString(
                                  lang === "ar" ? "ar-EG" : "en-GB"
                                )
                              : "-"}
                          </td>

                          <td className="px-3 py-2 text-slate-600">
                            {a.submittedAt
                              ? new Date(a.submittedAt).toLocaleDateString(
                                  lang === "ar" ? "ar-EG" : "en-GB"
                                )
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ParentAssignmentsPageFallback() {
  return <div className="space-y-6"><div className="h-32 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

export default function ParentAssignmentsPage() {
  return (
    <Suspense fallback={<ParentAssignmentsPageFallback />}>
      <ParentAssignmentsPageContent />
    </Suspense>
  );
}
