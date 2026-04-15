// src/app/teacher/dashboard/modals/QuizModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Lang, QuizRow, TeacherSubjectRow } from "../teacherDashboardTypes";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type QuizModalProps = {
  open: boolean;
  lang: Lang;
  initial: QuizRow | null;
  subjects: TeacherSubjectRow[];
  onClose: () => void;

  /** Support BOTH prop names to avoid your onSave/onSubmit mismatch */
  onSave?: (payload: {
    subject_id: number;
    title: string;
    description: string | null;
    due_at: string;
    max_score: number | null;
    quiz_url: string | null;
    is_active: number;
  }) => void | Promise<void>;

  onSubmit?: (payload: {
    subject_id: number;
    title: string;
    description: string | null;
    due_at: string;
    max_score: number | null;
    quiz_url: string | null;
    is_active: number;
  }) => void | Promise<void>;
};

export default function QuizModal({
  open,
  lang,
  initial,
  subjects,
  onClose,
  onSave,
  onSubmit,
}: QuizModalProps) {
  const ar = lang === "ar";
  const submitFn = onSave ?? onSubmit;

  const key = initial?.id ?? "new";
  const [subject_id, setSubjectId] = useState<number>(initial?.subject_id ?? 0);
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [due_at, setDueAt] = useState<string>(initial?.due_at ?? "");
  const [max_score, setMaxScore] = useState<string>(initial?.max_score == null ? "" : String(initial.max_score));
  const [quiz_url, setQuizUrl] = useState<string>(initial?.quiz_url ?? "");
  const [is_active, setIsActive] = useState<boolean>(Number(initial?.is_active ?? 1) === 1);

  useEffect(() => {
    if (!open) return;
    setSubjectId(initial?.subject_id ?? 0);
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setDueAt(initial?.due_at ?? "");
    setMaxScore(initial?.max_score == null ? "" : String(initial.max_score));
    setQuizUrl(initial?.quiz_url ?? "");
    setIsActive(Number(initial?.is_active ?? 1) === 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ui = useMemo(
    () => ({
      title: ar ? (initial ? "تعديل اختبار" : "اختبار جديد") : initial ? "Edit Quiz" : "New Quiz",
      close: ar ? "إغلاق" : "Close",
      save: ar ? "حفظ" : "Save",
      subject: ar ? "المادة" : "Subject",
      chooseSubject: ar ? "اختر المادة..." : "Choose subject...",
      dueAt: "due_at",
    }),
    [ar, initial]
  );

  if (!open) return null;

  const submit = async () => {
    if (!submitFn) return;

    const ms = max_score.trim() ? Number(max_score) : null;
    await submitFn({
      subject_id: Number(subject_id),
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      due_at: due_at.trim(),
      max_score: Number.isFinite(ms as number) ? ms : null,
      quiz_url: quiz_url.trim() ? quiz_url.trim() : null,
      is_active: is_active ? 1 : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className={cx("w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl", ar && "text-right")} dir={ar ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">{ui.title}</div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label={ui.close}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <div className="mb-1 text-xs font-semibold text-slate-700">{ui.subject}</div>
              <select
                value={subject_id > 0 ? String(subject_id) : ""}
                onChange={(e) => setSubjectId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">{ui.chooseSubject}</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {ar
                      ? subject.name_ar || subject.name_en
                      : subject.name_en || subject.name_ar}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div className="mb-1 text-xs font-semibold text-slate-700">{ui.dueAt}</div>
              <input value={due_at} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label className="sm:col-span-2">
              <div className="mb-1 text-xs font-semibold text-slate-700">title</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label className="sm:col-span-2">
              <div className="mb-1 text-xs font-semibold text-slate-700">description</div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label>
              <div className="mb-1 text-xs font-semibold text-slate-700">max_score</div>
              <input value={max_score} onChange={(e) => setMaxScore(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>

            <label>
              <div className="mb-1 text-xs font-semibold text-slate-700">is_active</div>
              <input type="checkbox" checked={is_active} onChange={(e) => setIsActive(e.target.checked)} />
            </label>

            <label className="sm:col-span-2">
              <div className="mb-1 text-xs font-semibold text-slate-700">quiz_url</div>
              <input value={quiz_url} onChange={(e) => setQuizUrl(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {ui.close}
          </button>
          <button onClick={() => void submit()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            {ui.save}
          </button>
        </div>
      </div>
    </div>
  );
}
