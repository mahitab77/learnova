"use client";

/**
 * TeacherLessonRequestsPanel
 * -----------------------------------------------------------------------------
 * Shows pending lesson requests and lets the teacher approve or reject each.
 *
 * Data flow:
 *  GET  /teacher/lesson-requests/pending  → list of PendingLessonRequestRow
 *  POST /teacher/lesson-requests/:id/approve
 *  POST /teacher/lesson-requests/:id/reject   (body: { reason: string | null })
 *
 * After approve/reject the hook refreshes both this list and sessionsAll so
 * the Sessions tab stays in sync.
 */

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Loader2, Inbox } from "lucide-react";
import type { Lang, PendingLessonRequestRow } from "../teacherDashboardTypes";
import type { TeacherDashboardLanguagePack } from "../teacherDashboardTexts";

type Props = {
  lang: Lang;
  t: TeacherDashboardLanguagePack;
  rows: PendingLessonRequestRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason?: string) => Promise<void>;
};

function fmtDateTime(raw: string, lang: Lang): string {
  const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherLessonRequestsPanel({
  lang,
  t,
  rows,
  loading,
  error,
  onRefresh,
  onApprove,
  onReject,
}: Props) {
  const lr = t.lessonRequests;
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Per-row action state
  const [actingId, setActingId] = useState<number | null>(null);
  // Which row is in reject-confirm mode
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove(id: number) {
    setActingId(id);
    try {
      await onApprove(id);
    } finally {
      setActingId(null);
    }
  }

  async function handleConfirmReject(id: number) {
    setActingId(id);
    try {
      await onReject(id, rejectReason.trim() || undefined);
      setRejectingId(null);
      setRejectReason("");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4" dir={dir}>
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{lr.title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{lr.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label={t.common.refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          <span className="ms-2 text-sm text-gray-500">{t.common.loading}</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-14 text-center">
          <Inbox className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">{lr.empty}</p>
        </div>
      )}

      {/* Request cards */}
      {!loading &&
        rows.map((row) => {
          const isActing = actingId === row.id;
          const isRejecting = rejectingId === row.id;
          const subjectName =
            lang === "ar" ? row.subject_name_ar : row.subject_name_en;

          // Show requester only when it differs from the student
          const showRequester =
            row.requester_name &&
            row.requester_name !== row.student_name &&
            row.requester_email !== row.student_email;

          return (
            <div
              key={row.id}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-4"
            >
              {/* Top row: subject + time */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                    {subjectName || lr.subject}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                  {t.status.pending}
                </span>
              </div>

              {/* Detail rows */}
              <dl className="mt-3 grid grid-cols-1 gap-y-1.5 text-sm sm:grid-cols-2">
                <div className="flex gap-1.5">
                  <dt className="font-medium text-gray-500">{lr.student}:</dt>
                  <dd className="text-gray-900">
                    {row.student_name}
                    {row.student_email ? (
                      <span className="ms-1 text-xs text-gray-400">
                        ({row.student_email})
                      </span>
                    ) : null}
                  </dd>
                </div>

                {showRequester && (
                  <div className="flex gap-1.5">
                    <dt className="font-medium text-gray-500">{lr.requestedBy}:</dt>
                    <dd className="text-gray-900">
                      {row.requester_name}
                      {row.requester_email ? (
                        <span className="ms-1 text-xs text-gray-400">
                          ({row.requester_email})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                )}

                <div className="flex gap-1.5 sm:col-span-2">
                  <dt className="font-medium text-gray-500">{lr.time}:</dt>
                  <dd className="text-gray-900">
                    {fmtDateTime(row.starts_at, lang)}
                    {" — "}
                    {fmtDateTime(row.ends_at, lang)}
                  </dd>
                </div>
              </dl>

              {/* Reject confirm inline */}
              {isRejecting && (
                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3">
                  <label className="mb-1.5 block text-xs font-medium text-rose-800">
                    {lr.rejectReason}
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={lr.rejectReasonPlaceholder}
                    className="w-full rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmReject(row.id)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      {isActing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {lr.confirmReject}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      disabled={isActing}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {lr.cancelReject}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons (hidden while in reject-confirm mode) */}
              {!isRejecting && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(row.id)}
                    disabled={isActing}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {isActing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    {lr.approve}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(row.id);
                      setRejectReason("");
                    }}
                    disabled={isActing}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {lr.reject}
                  </button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
