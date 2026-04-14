"use client";

import { useState } from "react";
import type {
  DashboardLesson,
  Lang,
  SessionRatingData,
  StudentLangTexts,
} from "../studentTypes";

type Props = {
  open: boolean;
  lang: Lang;
  t: StudentLangTexts;
  lesson: DashboardLesson | null;
  state: SessionRatingData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: { stars: number; comment: string }) => void;
};

type BodyProps = {
  lang: Lang;
  t: StudentLangTexts;
  lesson: DashboardLesson;
  state: SessionRatingData | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: { stars: number; comment: string }) => void;
};

function TeacherRatingModalBody({
  lang,
  t,
  lesson,
  state,
  saving,
  error,
  onClose,
  onSubmit,
}: BodyProps) {
  const [stars, setStars] = useState<number>(state?.rating?.stars ?? 0);
  const [comment, setComment] = useState<string>(state?.rating?.comment ?? "");

  const lessonTitle =
    lang === "ar"
      ? lesson.subjectNameAr || lesson.subjectNameEn || ""
      : lesson.subjectNameEn || lesson.subjectNameAr || "";

  const canRate = state?.canRate ?? false;
  const actionLabel = state?.rating ? t.rating.update : t.rating.save;
  const editableUntilLabel = state?.editableUntil
    ? new Date(state.editableUntil).toLocaleDateString(
        lang === "ar" ? "ar-EG" : "en-GB"
      )
    : null;

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{t.rating.title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {lesson.teacherName} · {lessonTitle}
        </p>
      </div>

      <div className="mb-3">
        <p className="mb-2 text-xs font-medium text-slate-700">
          {t.rating.yourRating}
        </p>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStars(value)}
              disabled={!canRate || saving}
              className={`text-2xl transition ${
                value <= stars ? "text-amber-400" : "text-slate-300"
              } ${!canRate ? "cursor-not-allowed opacity-60" : "hover:scale-110"}`}
              aria-label={`${value} star`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-700">
          {t.rating.optionalComment}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!canRate || saving}
          rows={4}
          maxLength={1000}
          placeholder={t.rating.placeholder}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-300 disabled:bg-slate-50"
        />
      </div>

      <div className="mb-3 space-y-1">
        <p className="text-[11px] text-slate-500">{t.rating.availableWindow}</p>
        {editableUntilLabel && (
          <p className="text-[11px] text-slate-400">
            {lang === "ar"
              ? `قابل للتعديل حتى: ${editableUntilLabel}`
              : `Editable until: ${editableUntilLabel}`}
          </p>
        )}
      </div>

      {!canRate && (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          {t.rating.notEligible}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300"
        >
          {t.actions.close}
        </button>

        <button
          type="button"
          onClick={() => onSubmit({ stars, comment })}
          disabled={!canRate || saving || stars < 1}
          className="rounded-full bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t.loading : actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function TeacherRatingModal({
  open,
  lang,
  t,
  lesson,
  state,
  loading,
  saving,
  error,
  onClose,
  onSubmit,
}: Props) {
  if (!open || !lesson) return null;

  const formKey = [
    lesson.sessionId,
    state?.rating?.stars ?? "new",
    state?.rating?.comment ?? "",
    state?.editableUntil ?? "",
    state?.canRate ? "1" : "0",
  ].join("|");

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      {loading ? (
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
          <p className="text-xs text-slate-500">{t.loading}</p>
        </div>
      ) : (
        <TeacherRatingModalBody
          key={formKey}
          lang={lang}
          t={t}
          lesson={lesson}
          state={state}
          saving={saving}
          error={error}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}