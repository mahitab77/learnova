// src/app/teacher/dashboard/panels/TeacherOverviewPanel.tsx
"use client";

import { useMemo } from "react";
import type { Lang, TeacherProfile, LessonSessionRow, OverviewStats } from "../teacherDashboardTypes";
import { CalendarDays, Users, ClipboardList, BookOpen, Clock, Download } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fmtDT(x: string): string {
  // Keep simple; backend returns "YYYY-MM-DD HH:MM:SS"
  return x?.replace("T", " ").slice(0, 16) ?? "";
}

export type TeacherOverviewPanelProps = {
  lang: Lang;
  profile: TeacherProfile | null;
  overview: OverviewStats;
  sessionsToday: LessonSessionRow[];
  onOpenSessionDetails: (sessionId: number) => void | Promise<void>;
  onExportCSV: <T extends Record<string, unknown>>(rows: T[], filename: string) => void;
};

export default function TeacherOverviewPanel({
  lang,
  profile,
  overview,
  sessionsToday,
  onOpenSessionDetails,
  onExportCSV,
}: TeacherOverviewPanelProps) {
  const ar = lang === "ar";

  const name = profile?.name ?? profile?.user_full_name ?? (ar ? "—" : "—");
  const email = profile?.user_email ?? "";

  const cards = useMemo(
    () => [
      { icon: <Users className="h-4 w-4" />, title: ar ? "طلاب معتمدون" : "Approved Students", value: overview.approvedStudents },
      { icon: <Clock className="h-4 w-4" />, title: ar ? "حصص قادمة" : "Upcoming Sessions", value: overview.upcoming },
      { icon: <ClipboardList className="h-4 w-4" />, title: ar ? "واجبات نشطة" : "Active Homework", value: overview.activeHw },
      { icon: <BookOpen className="h-4 w-4" />, title: ar ? "اختبارات نشطة" : "Active Quizzes", value: overview.activeQz },
      { icon: <CalendarDays className="h-4 w-4" />, title: ar ? "فترات نشطة" : "Active Slots", value: overview.activeSlots },
      { icon: <AlertTriangleIcon />, title: ar ? "استثناءات نشطة" : "Active Exceptions", value: overview.activeExceptions },
    ],
    [ar, overview]
  );

  return (
    <div className="space-y-6">
      {/* Profile mini header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">{name}</div>
        {email ? <div className="mt-0.5 text-xs text-slate-600">{email}</div> : null}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {c.icon}
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-700">{c.title}</div>
          </div>
        ))}
      </div>

      {/* Today sessions */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">{ar ? "حصص اليوم" : "Today Sessions"}</div>
            <div className="mt-0.5 text-xs text-slate-600">
              {ar ? "اضغط لعرض التفاصيل" : "Click a session to view details"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onExportCSV(sessionsToday as unknown as Record<string, unknown>[], "teacher_today_sessions")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {ar ? "تصدير" : "Export"}
          </button>
        </div>

        <div className="p-4">
          {sessionsToday.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {ar ? "لا توجد حصص اليوم." : "No sessions today."}
            </div>
          ) : (
            <div className="space-y-2">
              {sessionsToday.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void onOpenSessionDetails(s.id)}
                  className={cx(
                    "w-full rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50",
                    ar && "text-right"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {ar ? s.subject_name_ar : s.subject_name_en}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {fmtDT(s.starts_at)} → {fmtDT(s.ends_at)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {ar ? "الحالة:" : "Status:"} <span className="font-semibold">{s.status}</span>
                    {" • "}
                    {ar ? "الطلاب:" : "Students:"} <span className="font-semibold">{s.students_count}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertTriangleIcon() {
  // Small inline icon without extra lucide import to avoid unused conflicts
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
