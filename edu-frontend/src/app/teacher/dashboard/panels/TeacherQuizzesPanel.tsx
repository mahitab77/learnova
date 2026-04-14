// src/app/teacher/dashboard/panels/TeacherQuizzesPanel.tsx
"use client";

import { Download, Plus, Search } from "lucide-react";
import type { Lang, QuizRow } from "../teacherDashboardTypes";

export type TeacherQuizzesPanelProps = {
  lang: Lang;
  q: string;
  onQChange: (v: string) => void;
  rows: QuizRow[];
  onCreate: () => void;
  onEdit: (row: QuizRow) => void;
  onOpenSubmissions: (row: QuizRow) => void | Promise<void>;
  onExportCSV: <T extends Record<string, unknown>>(rows: T[], filename: string) => void;
};

export default function TeacherQuizzesPanel({
  lang,
  q,
  onQChange,
  rows,
  onCreate,
  onEdit,
  onOpenSubmissions,
  onExportCSV,
}: TeacherQuizzesPanelProps) {
  const ar = lang === "ar";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{ar ? "الاختبارات" : "Quizzes"}</div>
          <div className="mt-0.5 text-xs text-slate-600">{ar ? "بحث بالعنوان/المادة" : "Search by title/subject"}</div>
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
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {ar ? "جديد" : "New"}
          </button>

          <button
            type="button"
            onClick={() => onExportCSV(rows as unknown as Record<string, unknown>[], "teacher_quizzes")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {ar ? "تصدير" : "Export"}
          </button>
        </div>
      </div>

      <div className="p-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {ar ? "لا توجد بيانات." : "No data."}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {ar ? r.subject_name_ar : r.subject_name_en}
                      {" • "}
                      {ar ? "موعد:" : "Due:"} {r.due_at?.slice(0, 16)}
                      {" • "}
                      {ar ? "نشط:" : "Active:"} {Number(r.is_active) === 1 ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenSubmissions(r)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {ar ? "التسليمات" : "Submissions"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {ar ? "تعديل" : "Edit"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
