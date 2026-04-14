// src/app/teacher/dashboard/panels/TeacherSessionsPanel.tsx
"use client";

import { Download, Search } from "lucide-react";
import type { Lang, LessonSessionRow } from "../teacherDashboardTypes";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Platform timezone: backend stores naive Cairo datetimes (UTC+2, no DST).
// We display them using Intl so they always render as Cairo time regardless
// of the browser's locale.
const PLATFORM_TZ = "Africa/Cairo";

// 'approved' is a legacy alias for 'scheduled' kept only for backwards
// compatibility with pre-existing DB rows. Display it identically to 'scheduled'.
function normalizeSessionStatus(status: string): string {
  return status === "approved" ? "scheduled" : status;
}

function fmtDT(x: string): string {
  if (!x) return "";
  const v = x.trim();
  // Backend sends "YYYY-MM-DD HH:MM:SS" (naive Cairo) — anchor to +02:00
  const hasOffset = v.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(v);
  const iso = hasOffset ? v : (v.includes("T") ? v : v.replace(" ", "T")) + "+02:00";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return v.slice(0, 16).replace("T", " ");
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PLATFORM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d).replace(",", "");
}

export type TeacherSessionsPanelProps = {
  lang: Lang;
  q: string;
  onQChange: (v: string) => void;
  sessions: LessonSessionRow[];
  onOpenSessionDetails: (sessionId: number) => void | Promise<void>;
  onExportCSV: <T extends Record<string, unknown>>(rows: T[], filename: string) => void;
};

export default function TeacherSessionsPanel({
  lang,
  q,
  onQChange,
  sessions,
  onOpenSessionDetails,
  onExportCSV,
}: TeacherSessionsPanelProps) {
  const ar = lang === "ar";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{ar ? "الحصص" : "Sessions"}</div>
          <div className="mt-0.5 text-xs text-slate-600">{ar ? "بحث حسب المادة/الحالة/التاريخ" : "Search by subject/status/date"}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {ar ? "جميع الأوقات بتوقيت القاهرة (EET، UTC+2)" : "All times in Cairo time (EET, UTC+2)"}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              placeholder={ar ? "بحث..." : "Search..."}
              className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm outline-none focus:border-slate-400 sm:w-[320px]"
            />
          </div>

          <button
            type="button"
            onClick={() => onExportCSV(sessions as unknown as Record<string, unknown>[], "teacher_sessions")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {ar ? "تصدير" : "Export"}
          </button>
        </div>
      </div>

      <div className="p-4">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {ar ? "لا توجد بيانات." : "No data."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">{ar ? "المادة" : "Subject"}</th>
                  <th className="px-4 py-3">{ar ? "الوقت" : "Time"}</th>
                  <th className="px-4 py-3">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3">{ar ? "طلاب" : "Students"}</th>
                  <th className="px-4 py-3">{ar ? "إجراء" : "Action"}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {sessions.map((s) => (
                  <tr key={s.id} className={cx("text-slate-800", ar && "text-right")}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {ar ? s.subject_name_ar : s.subject_name_en}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {fmtDT(s.starts_at)} → {fmtDT(s.ends_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{normalizeSessionStatus(s.status)}</td>
                    <td className="px-4 py-3 text-slate-700">{s.students_count}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void onOpenSessionDetails(s.id)}
                        className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        {ar ? "تفاصيل" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
