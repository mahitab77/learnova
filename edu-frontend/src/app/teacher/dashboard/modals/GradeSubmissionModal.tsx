// src/app/teacher/dashboard/modals/GradeSubmissionModal.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import type { Lang, GradeTarget } from "../teacherDashboardTypes";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type GradeSubmissionModalProps = {
  open: boolean;
  lang: Lang;
  target: GradeTarget;
  onClose: () => void;

  /** Hook's saveGrade only needs score/feedback */
  onSave: (payload: { score: number | null; feedback: string | null }) => void | Promise<void>;
};

export default function GradeSubmissionModal({ open, lang, target, onClose, onSave }: GradeSubmissionModalProps) {
  const ar = lang === "ar";
  const scoreRef = useRef<HTMLInputElement | null>(null);
  const feedbackRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ui = useMemo(() => ({
    title: ar ? "تقييم" : "Grade",
    close: ar ? "إغلاق" : "Close",
    save: ar ? "حفظ" : "Save",
    score: ar ? "الدرجة" : "Score",
    feedback: ar ? "ملاحظات" : "Feedback",
  }), [ar]);

  if (!open) return null;

  const submit = async () => {
    const raw = scoreRef.current?.value?.trim() ?? "";
    const score = raw ? Number(raw) : null;
    const fb = feedbackRef.current?.value?.trim() ?? "";

    await onSave({
      score: Number.isFinite(score as number) ? score : null,
      feedback: fb ? fb : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className={cx("w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl", ar && "text-right")} dir={ar ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">
            {ui.title}
            {target ? <span className="ms-2 text-xs font-normal text-slate-600">({target.kind} #{target.submissionId})</span> : null}
          </div>

          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50" aria-label={ui.close}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ui.score}</div>
            <input
              ref={scoreRef}
              defaultValue={target?.currentScore == null ? "" : String(target.currentScore)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ui.feedback}</div>
            <textarea
              ref={feedbackRef}
              defaultValue={target?.currentFeedback ?? ""}
              className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {ui.close}
          </button>
          <button onClick={() => void submit()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800" disabled={!target}>
            {ui.save}
          </button>
        </div>
      </div>
    </div>
  );
}
