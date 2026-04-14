// src/app/teacher/dashboard/modals/SessionDetailsModal.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatCairoFullDateTime, parseCairoNaive } from "@/src/lib/cairoTime";
import type { Lang, LessonSessionDetails } from "../teacherDashboardTypes";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Cancellation cutoff: must match backend CANCEL_CUTOFF_HOURS (2 h).
const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000;

function fmtDT(x: string): string {
  return formatCairoFullDateTime(x, "en-GB") || x.slice(0, 16).replace("T", " ");
}

export type SessionDetailsModalProps = {
  open: boolean;
  lang: Lang;
  loading: boolean;
  details: LessonSessionDetails | null;
  onClose: () => void;
  onUpdateAttendance: (
    sessionId: number,
    studentId: number,
    attendance_status: LessonSessionDetails["students"][number]["attendance_status"]
  ) => void | Promise<void>;
  onCancelSession?: (sessionId: number, reason?: string) => void | Promise<void>;
};

export default function SessionDetailsModal({ open, lang, loading, details, onClose, onUpdateAttendance, onCancelSession }: SessionDetailsModalProps) {
  const ar = lang === "ar";
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [modalNowMs, setModalNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const tick = () => setModalNowMs(Date.now());
    const frameId = window.requestAnimationFrame(tick);
    const intervalId = window.setInterval(tick, 30_000);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
    };
  }, [open, details?.session?.id]);

  const resetModalState = useCallback(() => {
    setShowCancelConfirm(false);
    setCancelReason("");
  }, []);

  const handleClose = useCallback(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open) return null;

  const session = details?.session ?? null;

  // 'approved' is a legacy alias for 'scheduled'; both statuses are cancellable.
  const isCancelEligible =
    (session?.status === "scheduled" || session?.status === "approved") &&
    !!session.starts_at &&
    parseCairoNaive(session.starts_at).getTime() - modalNowMs > CANCEL_CUTOFF_MS;

  const handleCancelConfirm = async () => {
    if (!session || !onCancelSession) return;
    await onCancelSession(session.id, cancelReason.trim() || undefined);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className={cx("w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl", ar && "text-right")} dir={ar ? "rtl" : "ltr"}>
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{ar ? "تفاصيل الحصة" : "Session Details"}</div>
            {session ? (
              <div className="mt-1 text-xs text-slate-600">
                {ar ? session.subject_name_ar : session.subject_name_en}
                {" • "}
                {fmtDT(session.starts_at)} → {fmtDT(session.ends_at)}
                {" • "}
                {session.status}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
            aria-label={ar ? "إغلاق" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              {ar ? "جارٍ التحميل..." : "Loading..."}
            </div>
          ) : !details ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {ar ? "لا توجد بيانات." : "No data."}
            </div>
          ) : details.students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {ar ? "لا يوجد طلاب." : "No students."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">{ar ? "الطالب" : "Student"}</th>
                    <th className="px-4 py-3">{ar ? "الحضور" : "Attendance"}</th>
                    <th className="px-4 py-3">{ar ? "تحديث" : "Update"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {details.students.map((s) => (
                    <tr key={s.student_id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{s.student_name}</div>
                        <div className="text-xs text-slate-600">{s.student_email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-800">{s.attendance_status}</td>
                      <td className="px-4 py-3">
                        <select
                          value={s.attendance_status}
                          onChange={(e) => void onUpdateAttendance(details.session.id, s.student_id, e.target.value as typeof s.attendance_status)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          {["scheduled", "present", "absent", "late", "excused"].map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          {/* Cancel flow — only for eligible scheduled sessions */}
          {onCancelSession && isCancelEligible && (
            <div className="mb-3">
              {!showCancelConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  {ar ? "إلغاء الحصة" : "Cancel Session"}
                </button>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-red-800">
                    {ar ? "تأكيد إلغاء الحصة" : "Confirm cancellation"}
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={ar ? "سبب الإلغاء (اختياري)" : "Reason for cancellation (optional)"}
                    rows={2}
                    className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-slate-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCancelConfirm()}
                      className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      {ar ? "تأكيد الإلغاء" : "Confirm Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {ar ? "رجوع" : "Back"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            {ar ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
