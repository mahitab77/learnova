// src/app/teacher/dashboard/modals/SubmissionsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import type { Lang, HomeworkSubmissionRow, QuizSubmissionRow, GradeTarget } from "../teacherDashboardTypes";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type SubmissionsModalProps = {
  open: boolean;
  lang: Lang;
  title: string;
  loading: boolean;
  homeworkSubmissions: HomeworkSubmissionRow[] | null;
  quizSubmissions: QuizSubmissionRow[] | null;
  onClose: () => void;
  onOpenGrade: (x: Exclude<GradeTarget, null>) => void;
};

export default function SubmissionsModal({
  open,
  lang,
  title,
  loading,
  homeworkSubmissions,
  quizSubmissions,
  onClose,
  onOpenGrade,
}: SubmissionsModalProps) {
  const ar = lang === "ar";
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const kind: "homework" | "quiz" = homeworkSubmissions != null ? "homework" : "quiz";
  
  const rows = useMemo(() => {
    return (homeworkSubmissions ?? quizSubmissions ?? []) as Array<HomeworkSubmissionRow | QuizSubmissionRow>;
  }, [homeworkSubmissions, quizSubmissions]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.student_name} ${r.student_email} ${r.status}`.toLowerCase().includes(s));
  }, [q, rows]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className={cx("w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl", ar && "text-right")} dir={ar ? "rtl" : "ltr"}>
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-600">{kind} • {rows.length}</div>
          </div>

          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label={ar ? "إغلاق" : "Close"}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={ar ? "بحث..." : "Search..."}
              className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              {ar ? "جارٍ التحميل..." : "Loading..."}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {ar ? "لا توجد تسليمات." : "No submissions."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">{ar ? "الطالب" : "Student"}</th>
                    <th className="px-4 py-3">{ar ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-3">{ar ? "الدرجة" : "Score"}</th>
                    <th className="px-4 py-3">{ar ? "إجراء" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.student_name}</div>
                        <div className="text-xs text-slate-600">{r.student_email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-800">{r.status}</td>
                      <td className="px-4 py-3 text-slate-900 font-semibold">{r.score == null ? "—" : String(r.score)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenGrade({
                              kind,
                              submissionId: r.id,
                              currentScore: r.score,
                              currentFeedback: r.feedback,
                            })
                          }
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          {ar ? "تقييم" : "Grade"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {ar ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
