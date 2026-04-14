// src/app/teacher/dashboard/panels/TeacherStudentsPanel.tsx
"use client";

import { Download, Search } from "lucide-react";
import type { Lang, TeacherStudentRow } from "../teacherDashboardTypes";

export type TeacherStudentsPanelProps = {
  lang: Lang;
  q: string;
  onQChange: (v: string) => void;
  students: TeacherStudentRow[];
  onExportCSV: <T extends Record<string, unknown>>(rows: T[], filename: string) => void;
};

export default function TeacherStudentsPanel({ lang, q, onQChange, students, onExportCSV }: TeacherStudentsPanelProps) {
  const ar = lang === "ar";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{ar ? "الطلاب" : "Students"}</div>
          <div className="mt-0.5 text-xs text-slate-600">{ar ? "بحث بالطالب/البريد/المادة" : "Search by student/email/subject"}</div>
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
            onClick={() => onExportCSV(students as unknown as Record<string, unknown>[], "teacher_students")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {ar ? "تصدير" : "Export"}
          </button>
        </div>
      </div>

      <div className="p-4">
        {students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {ar ? "لا توجد بيانات." : "No data."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">{ar ? "الطالب" : "Student"}</th>
                  <th className="px-4 py-3">{ar ? "المادة" : "Subject"}</th>
                  <th className="px-4 py-3">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3">{ar ? "تاريخ الاختيار" : "Selected at"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {students.map((s) => (
                  <tr key={s.id} className={ar ? "text-right" : "text-left"}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.student_name}</div>
                      <div className="text-xs text-slate-600">{s.student_email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{ar ? s.subject_name_ar : s.subject_name_en}</td>
                    <td className="px-4 py-3 text-slate-800">{s.status}</td>
                    <td className="px-4 py-3 text-slate-700">{s.selected_at?.slice(0, 16)}</td>
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
