"use client";

// ============================================================================
// ModeratorSessionsPanel
// ----------------------------------------------------------------------------
// - Filterable/searchable session list
// - Expandable rows show enrolled students with attendance status
// - "Excuse" button per student (only write action moderators have)
// ============================================================================

import { useMemo, useState, useCallback } from "react";
import type { Lang } from "../moderatorTypes";
import type { LangTexts } from "../moderatorTexts";
import { formatDateTime } from "../moderatorTypes";
import { getModeratorSessionStudents } from "@/src/services/moderatorService";
import type {
  ModeratorSessionRow,
  ModeratorSessionStudentRow,
} from "@/src/services/moderatorService";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  lang: Lang;
  t: LangTexts;
  sessions: ModeratorSessionRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onMarkExcused: (sessionId: number, studentId: number) => Promise<void>;
}

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Attendance status badge colour
// ---------------------------------------------------------------------------
function attendanceBadge(status: string) {
  switch (status) {
    case "present":
      return "bg-emerald-50 text-emerald-700";
    case "absent":
      return "bg-red-50 text-red-700";
    case "late":
      return "bg-amber-50 text-amber-700";
    case "excused":
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function ModeratorSessionsPanel({
  lang,
  t,
  sessions,
  loading,
  error,
  onRefresh,
  onMarkExcused,
}: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  // -------------------------------------------------------------------------
  // Toolbar state
  // -------------------------------------------------------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // -------------------------------------------------------------------------
  // Expanded session state
  // -------------------------------------------------------------------------
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<ModeratorSessionStudentRow[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  // Per-student excuse loading & feedback
  const [excusingId, setExcusingId] = useState<number | null>(null);
  const [excuseMsg, setExcuseMsg] = useState<{ studentId: number; msg: string; ok: boolean } | null>(null);

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (term) {
        const hay = `${s.teacher_name} ${s.subject_name_en} ${s.subject_name_ar}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [sessions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  // -------------------------------------------------------------------------
  // Expand a session row → load its students
  // -------------------------------------------------------------------------
  const toggleExpand = useCallback(
    async (sessionId: number) => {
      if (expandedId === sessionId) {
        setExpandedId(null);
        setExpandedStudents([]);
        setExpandedError(null);
        return;
      }
      setExpandedId(sessionId);
      setExpandedStudents([]);
      setExpandedError(null);
      setExpandedLoading(true);
      setExcuseMsg(null);
      try {
        const data = await getModeratorSessionStudents(sessionId);
        setExpandedStudents(data);
      } catch {
        setExpandedError(lang === "ar" ? "تعذر تحميل بيانات الطلاب." : "Failed to load students.");
      } finally {
        setExpandedLoading(false);
      }
    },
    [expandedId, lang]
  );

  // -------------------------------------------------------------------------
  // Excuse a student
  // -------------------------------------------------------------------------
  const handleExcuse = useCallback(
    async (sessionId: number, studentId: number) => {
      setExcusingId(studentId);
      setExcuseMsg(null);
      try {
        await onMarkExcused(sessionId, studentId);
        // Reflect locally
        setExpandedStudents((prev) =>
          prev.map((s) =>
            s.student_id === studentId ? { ...s, attendance_status: "excused" } : s
          )
        );
        setExcuseMsg({ studentId, msg: t.studentsSubExcuseSuccess, ok: true });
      } catch {
        setExcuseMsg({ studentId, msg: t.studentsSubExcuseError, ok: false });
      } finally {
        setExcusingId(null);
      }
    },
    [onMarkExcused, t]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <section dir={dir} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.sessionsTitle}</h2>
          <p className="text-xs text-slate-500">{t.sessionsDesc}</p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs rounded-md border px-3 py-1 bg-white hover:bg-slate-50"
        >
          {t.refresh}
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t.sessionsSearchPlaceholder}
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs"
        >
          <option value="all">{t.sessionsFilterAll}</option>
          <option value="scheduled">{lang === "ar" ? "مجدولة" : "Scheduled"}</option>
          <option value="completed">{lang === "ar" ? "مكتملة" : "Completed"}</option>
          <option value="cancelled">{lang === "ar" ? "ملغاة" : "Cancelled"}</option>
          <option value="pending">{lang === "ar" ? "معلقة" : "Pending"}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">{t.loading}</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">{t.sessionsNone}</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.sessionsColTeacher}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.sessionsColSubject}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.sessionsColTime}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.sessionsColStudents}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.sessionsColStatus}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paged.map((s) => (
                  <>
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{s.teacher_name}</td>
                      <td className="px-3 py-2">
                        {lang === "ar" ? s.subject_name_ar : s.subject_name_en}
                      </td>
                      <td className="px-3 py-2">
                        <div>{formatDateTime(s.starts_at, lang)}</div>
                        <div className="text-[10px] text-slate-400">→ {formatDateTime(s.ends_at, lang)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full px-2 py-0.5 bg-slate-100 text-slate-700">
                          {s.students_count}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full px-2 py-0.5 bg-slate-100 text-slate-700">
                          {/* 'approved' is a legacy alias for 'scheduled'; display identically */}
                          {s.status === "approved" ? "scheduled" : s.status}
                        </span>
                        <span className={`ms-1 rounded-full px-2 py-0.5 ${s.is_group ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {s.is_group ? t.sessionsGroup : t.sessionsIndividual}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => void toggleExpand(s.id)}
                          className="text-[11px] text-emerald-600 hover:underline"
                        >
                          {expandedId === s.id ? t.sessionsCollapse : t.sessionsExpand}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded students sub-table */}
                    {expandedId === s.id && (
                      <tr key={`${s.id}-expanded`}>
                        <td colSpan={6} className="px-4 py-3 bg-slate-50">
                          {expandedLoading ? (
                            <p className="text-xs text-slate-500">{t.loading}</p>
                          ) : expandedError ? (
                            <p className="text-xs text-red-600">{expandedError}</p>
                          ) : expandedStudents.length === 0 ? (
                            <p className="text-xs text-slate-500">{t.studentsSubNone}</p>
                          ) : (
                            <table className="min-w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-white">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsSubColName}</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsSubColEmail}</th>
                                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsSubColAttendance}</th>
                                  <th className="px-3 py-2" />
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {expandedStudents.map((st) => (
                                  <tr key={st.student_id} className="bg-white">
                                    <td className="px-3 py-2">{st.student_name}</td>
                                    <td className="px-3 py-2 text-slate-500">{st.email}</td>
                                    <td className="px-3 py-2">
                                      <span className={`rounded-full px-2 py-0.5 ${attendanceBadge(st.attendance_status)}`}>
                                        {st.attendance_status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {st.attendance_status !== "excused" ? (
                                        <button
                                          disabled={excusingId === st.student_id}
                                          onClick={() => void handleExcuse(s.id, st.student_id)}
                                          className="text-[11px] rounded-md border border-sky-300 text-sky-600 px-2 py-0.5 hover:bg-sky-50 disabled:opacity-50"
                                        >
                                          {excusingId === st.student_id ? t.studentsSubExcusing : t.studentsSubExcuse}
                                        </button>
                                      ) : null}
                                      {excuseMsg?.studentId === st.student_id && (
                                        <span className={`ms-2 text-[10px] ${excuseMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
                                          {excuseMsg.msg}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
