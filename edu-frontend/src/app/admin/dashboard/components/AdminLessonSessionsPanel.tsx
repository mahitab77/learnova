"use client";

// ============================================================================
// AdminLessonSessionsPanel
// ----------------------------------------------------------------------------
// Responsibilities:
//  - Read-only view of executed / scheduled lesson sessions
//  - Admin observability (NO actions)
//  - Filter by status
//  - Search by student or teacher
//  - Pagination
// ============================================================================

import { useMemo, useState } from "react";
import type { Lang, AdminLessonSessionRow } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface AdminLessonSessionsPanelProps {
  lang: Lang;
  t: LangTexts;
  sessions: AdminLessonSessionRow[];
  loading: boolean;
  error: string | null;

  /** Re-fetch sessions from backend */
  onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
type StatusFilter = "all" | AdminLessonSessionRow["status"];
const PAGE_SIZE = 10;

export function AdminLessonSessionsPanel({
  lang,
  t,
  sessions,
  loading,
  error,
  onRefresh,
}: AdminLessonSessionsPanelProps) {
  // -------------------------------------------------------------------------
  // Direction
  // -------------------------------------------------------------------------
  const dir = lang === "ar" ? "rtl" : "ltr";

  // -------------------------------------------------------------------------
  // Local state
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------
  const filteredSessions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;

      if (term) {
        const haystack = `${s.student_name} ${s.teacher_name}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [sessions, searchTerm, statusFilter]);

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / PAGE_SIZE)
  );

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pagedSessions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSessions.slice(start, start + PAGE_SIZE);
  }, [filteredSessions, safePage]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <section
      dir={dir}
      className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {lang === "ar" ? "جلسات الدروس" : "Lesson Sessions"}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === "ar"
              ? "عرض الجلسات المجدولة والمنفذة (للمتابعة فقط)"
              : "View scheduled and completed lesson sessions (read-only)"}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs rounded-md border px-3 py-1 bg-white hover:bg-slate-50"
        >
          {lang === "ar" ? "تحديث" : "Refresh"}
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder={
            lang === "ar"
              ? "بحث باسم الطالب أو المعلم..."
              : "Search by student or teacher..."
          }
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs"
        >
          <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
          <option value="scheduled">
            {lang === "ar" ? "مجدولة" : "Scheduled"}
          </option>
          <option value="completed">
            {lang === "ar" ? "مكتملة" : "Completed"}
          </option>
          <option value="cancelled">
            {lang === "ar" ? "ملغاة" : "Cancelled"}
          </option>
          <option value="no_show">
            {lang === "ar" ? "لم يحضر" : "No-show"}
          </option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">
            {t.requestsLoading}
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            {lang === "ar"
              ? "لا توجد جلسات مطابقة."
              : "No lesson sessions found."}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "الطالب" : "Student"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "المعلم" : "Teacher"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "المادة" : "Subject"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "الوقت" : "Time"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "النوع" : "Type"}
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    {lang === "ar" ? "الحالة" : "Status"}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {pagedSessions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2">{s.student_name}</td>
                    <td className="px-3 py-2">{s.teacher_name}</td>
                    <td className="px-3 py-2">
                      {lang === "ar"
                        ? s.subject_name_ar
                        : s.subject_name_en}
                    </td>
                    <td className="px-3 py-2">
                      {s.start_time}–{s.end_time}
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(s.session_date ?? "")}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          s.is_group
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {s.is_group
                          ? lang === "ar"
                            ? "جماعي"
                            : "Group"
                          : lang === "ar"
                          ? "فردي"
                          : "Individual"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700">
                        {/* 'approved' is a legacy alias for 'scheduled'; display identically */}
                        {s.status === "approved" ? "scheduled" : s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px]">
              <span>
                {lang === "ar"
                  ? `صفحة ${safePage} من ${totalPages}`
                  : `Page ${safePage} of ${totalPages}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-2 py-1 rounded border disabled:opacity-50"
                >
                  {lang === "ar" ? "السابق" : "Previous"}
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage === totalPages}
                  className="px-2 py-1 rounded border disabled:opacity-50"
                >
                  {lang === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
