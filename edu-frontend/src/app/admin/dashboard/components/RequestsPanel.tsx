"use client";

// ============================================================================
// RequestsPanel Component (Parent + Lesson Requests) — UI/UX IMPROVED
// ----------------------------------------------------------------------------
// ✅ Clearly reveals TWO request types (Lesson + Parent)
// ✅ Prioritizes LESSON requests visually + placement (top + vibrant styling)
// ✅ Keeps existing props + typing (NO any)
// ✅ Shared search + status filter
// ✅ Separate pagination per section so lesson requests never get buried
// ============================================================================

import { useMemo, useState } from "react";
import type { Lang, ParentRequestRow } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RequestType = "parent" | "lesson";

type AdminRequestRow = ParentRequestRow & {
  request_type?: RequestType; // defaults to "parent"
};

export type RequestsPanelProps = {
  lang: Lang;
  t: LangTexts;
  requests: AdminRequestRow[];
  requestsLoading: boolean;
  requestsError: string | null;
  approvingId: number | null;
  rejectingId: number | null;
  approvingLessonId: number | null;
  cancellingLessonId: number | null;
  handleApproveRequest: (id: number) => void;
  handleRejectRequest: (id: number) => void;
  handleApproveLessonRequest: (id: number) => void;
  handleCancelLessonSession: (id: number, reason?: string) => void;
};

type RequestStatusFilter = "all" | "pending" | "approved" | "rejected";
const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function RequestsPanel({
  lang,
  t,
  requests,
  requestsLoading,
  requestsError,
  approvingId,
  rejectingId,
  approvingLessonId,
  cancellingLessonId,
  handleApproveRequest,
  handleRejectRequest,
  handleApproveLessonRequest,
  handleCancelLessonSession,
}: RequestsPanelProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  // -------------------------------------------------------------------------
  // Local UI state
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<RequestStatusFilter>("all");

  // Separate pagination so Lesson requests always get their own page controls
  const [lessonPage, setLessonPage] = useState(1);
  const [parentPage, setParentPage] = useState(1);

  // -------------------------------------------------------------------------
  // Formatting
  // -------------------------------------------------------------------------
  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -------------------------------------------------------------------------
  // Normalize + filter
  // -------------------------------------------------------------------------
  const normalizedRequests = useMemo(() => {
    return requests.map((r) => ({
      ...r,
      request_type: (r.request_type ?? "parent") as RequestType,
    }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return normalizedRequests.filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;

      if (term) {
        const parentName = (req.parent_name || "").toLowerCase();
        const studentName = (req.student_name || "").toLowerCase();
        // NOTE: You can later expand this to search by subject/teacher/id if needed
        if (!parentName.includes(term) && !studentName.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [normalizedRequests, searchTerm, statusFilter]);

  // Split into two visible sections
  const lessonRequests = useMemo(
    () => filteredRequests.filter((r) => r.request_type === "lesson"),
    [filteredRequests]
  );
  const parentRequests = useMemo(
    () => filteredRequests.filter((r) => r.request_type === "parent"),
    [filteredRequests]
  );

  // -------------------------------------------------------------------------
  // Pagination per section
  // -------------------------------------------------------------------------
  const lessonTotalPages = Math.max(
    1,
    Math.ceil(lessonRequests.length / PAGE_SIZE)
  );
  const parentTotalPages = Math.max(
    1,
    Math.ceil(parentRequests.length / PAGE_SIZE)
  );

  const safeLessonPage = clamp(lessonPage, 1, lessonTotalPages);
  const safeParentPage = clamp(parentPage, 1, parentTotalPages);

  const pagedLessonRequests = useMemo(() => {
    const start = (safeLessonPage - 1) * PAGE_SIZE;
    return lessonRequests.slice(start, start + PAGE_SIZE);
  }, [lessonRequests, safeLessonPage]);

  const pagedParentRequests = useMemo(() => {
    const start = (safeParentPage - 1) * PAGE_SIZE;
    return parentRequests.slice(start, start + PAGE_SIZE);
  }, [parentRequests, safeParentPage]);

  // If filters change, reset pagination to first page (both sections)
  const onSearchChange = (val: string) => {
    setSearchTerm(val);
    setLessonPage(1);
    setParentPage(1);
  };
  const onStatusChange = (val: RequestStatusFilter) => {
    setStatusFilter(val);
    setLessonPage(1);
    setParentPage(1);
  };

  // -------------------------------------------------------------------------
  // Shared table renderer (keeps consistency across both sections)
  // -------------------------------------------------------------------------
  const renderTable = (rows: AdminRequestRow[], kind: RequestType) => {
    const isLessonKind = kind === "lesson";

    return (
      <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
        {requestsLoading ? (
          <div className="p-4 text-sm text-slate-500">{t.requestsLoading}</div>
        ) : requestsError ? (
          <div className="p-4 text-sm text-red-600">{t.requestsError}</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            {isLessonKind
              ? lang === "ar"
                ? "لا توجد طلبات حصص مطابقة للفلتر الحالي."
                : "No lesson requests match the current filters."
              : lang === "ar"
              ? "لا توجد طلبات أولياء أمور مطابقة للفلتر الحالي."
              : "No parent requests match the current filters."}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">
                  {lang === "ar" ? "النوع" : "Type"}
                </th>
                <th className="px-3 py-2 text-left">{t.requestsTableParent}</th>
                <th className="px-3 py-2 text-left">{t.requestsTableStudent}</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">
                  {t.requestsTableSubject}
                </th>
                <th className="px-3 py-2 text-left">{t.requestsTableStatus}</th>
                <th className="px-3 py-2 text-left">{t.requestsTableActions}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((req) => {
                const type: RequestType = (req.request_type ?? "parent") as RequestType;
                const isLesson = type === "lesson";
                const isPending = req.status === "pending";

                return (
                  <tr key={req.id} className={isLesson ? "bg-white" : "bg-white"}>
                    {/* Type badge */}
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          isLesson
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            isLesson ? "bg-violet-500" : "bg-sky-500"
                          }`}
                        />
                        {isLesson
                          ? lang === "ar"
                            ? "حصة"
                            : "Lesson"
                          : lang === "ar"
                          ? "ولي أمر"
                          : "Parent"}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">
                        {req.parent_name || "—"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(req.created_at)}
                      </div>
                    </td>

                    <td className="px-3 py-2">{req.student_name}</td>

                    <td className="px-3 py-2 hidden md:table-cell">
                      {lang === "ar" ? req.subject_name_ar : req.subject_name_en}
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] border ${
                          req.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : req.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-3 py-2">
                      {isLesson ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApproveLessonRequest(req.id)}
                            disabled={approvingLessonId === req.id}
                            className="px-2 py-1 text-[11px] bg-violet-600 text-white rounded disabled:opacity-60"
                          >
                            {lang === "ar"
                              ? approvingLessonId === req.id
                                ? "جاري الاعتماد..."
                                : "اعتماد"
                              : approvingLessonId === req.id
                              ? "Approving..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => handleCancelLessonSession(req.id)}
                            disabled={cancellingLessonId === req.id}
                            className="px-2 py-1 text-[11px] border border-red-200 text-red-700 rounded disabled:opacity-60"
                          >
                            {lang === "ar"
                              ? cancellingLessonId === req.id
                                ? "جاري الإلغاء..."
                                : "إلغاء"
                              : cancellingLessonId === req.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        </div>
                      ) : isPending ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={approvingId === req.id}
                            className="px-2 py-1 text-[11px] bg-emerald-500 text-white rounded disabled:opacity-60"
                          >
                            {t.requestsApprove}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={rejectingId === req.id}
                            className="px-2 py-1 text-[11px] border border-red-200 text-red-700 rounded disabled:opacity-60"
                          >
                            {t.requestsReject}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <section
      className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4"
      dir={dir}
    >
      {/* Main header: no longer implies only parent requests */}
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {lang === "ar" ? "الطلبات" : t.requestsTitle}
          </h2>

          {/* Quick totals to “reveal” both types even before scrolling */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              {lang === "ar" ? "طلبات الحصص" : "Lesson Requests"}:{" "}
              <span className="font-semibold">{lessonRequests.length}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-sky-50 text-sky-700 border-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {lang === "ar" ? "طلبات تغيير المدرس" : "Parent Change Requests"}:{" "}
              <span className="font-semibold">{parentRequests.length}</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {lang === "ar"
            ? "يوجد نوعان من الطلبات: طلبات حصص (أولوية) وطلبات تغيير المدرس من ولي الأمر."
            : "There are two request types: Lesson requests (priority) and Parent change requests."}
        </p>
      </header>

      {/* Toolbar (shared filters) */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between">
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            lang === "ar"
              ? "بحث باسم ولي الأمر أو الطالب..."
              : "Search by parent or student..."
          }
          className="w-full md:max-w-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
        />

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as RequestStatusFilter)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
        >
          <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
          <option value="pending">{t.requestsStatusPending}</option>
          <option value="approved">{t.requestsStatusApproved}</option>
          <option value="rejected">{t.requestsStatusRejected}</option>
        </select>
      </div>

      {/* If absolutely nothing exists (post-filter), show a helpful empty state */}
      {!requestsLoading &&
      !requestsError &&
      lessonRequests.length === 0 &&
      parentRequests.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
          {lang === "ar"
            ? "لا توجد طلبات مطابقة للفلتر الحالي."
            : t.requestsNone}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ---------------------------------------------------------------- */}
          {/* Lesson Requests (PRIORITY) */}
          {/* ---------------------------------------------------------------- */}
          <div className="rounded-2xl border border-violet-200 bg-linear-to-r from-violet-50 via-fuchsia-50 to-indigo-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {lang === "ar" ? "طلبات الحصص (أولوية)" : "Lesson Requests (Priority)"}
                  </h3>
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border bg-violet-100 text-violet-800 border-violet-200">
                    {lang === "ar" ? "أولوية" : "Priority"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {lang === "ar"
                    ? "هذه الطلبات تظهر أولاً وتحتاج متابعة سريعة."
                    : "These requests are surfaced first and should be reviewed quickly."}
                </p>
              </div>

              <div className="text-[11px] text-slate-600">
                {lang === "ar"
                  ? `الإجمالي: ${lessonRequests.length}`
                  : `Total: ${lessonRequests.length}`}
              </div>
            </div>

            {renderTable(pagedLessonRequests, "lesson")}

            {/* Pagination (Lesson) */}
            <div className="flex justify-between items-center px-1 pt-3 text-[11px]">
              <span className="text-slate-600">
                {lang === "ar"
                  ? `صفحة ${safeLessonPage} من ${lessonTotalPages}`
                  : `Page ${safeLessonPage} of ${lessonTotalPages}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLessonPage((p) => Math.max(1, p - 1))}
                  disabled={safeLessonPage === 1}
                  className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-50"
                >
                  {lang === "ar" ? "السابق" : "Prev"}
                </button>
                <button
                  onClick={() => setLessonPage((p) => Math.min(lessonTotalPages, p + 1))}
                  disabled={safeLessonPage === lessonTotalPages}
                  className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-50"
                >
                  {lang === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Parent Requests */}
          {/* ---------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-150 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {lang === "ar" ? "طلبات أولياء الأمور" : "Parent Change Requests"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {lang === "ar"
                    ? "يمكن للمشرف الموافقة أو الرفض لطلبات تغيير المدرس."
                    : "Admin can approve/reject parent requests to change a student's teacher."}
                </p>
              </div>

              <div className="text-[11px] text-slate-500">
                {lang === "ar"
                  ? `الإجمالي: ${parentRequests.length}`
                  : `Total: ${parentRequests.length}`}
              </div>
            </div>

            {renderTable(pagedParentRequests, "parent")}

            {/* Pagination (Parent) */}
            <div className="flex justify-between items-center px-1 pt-3 text-[11px]">
              <span className="text-slate-600">
                {lang === "ar"
                  ? `صفحة ${safeParentPage} من ${parentTotalPages}`
                  : `Page ${safeParentPage} of ${parentTotalPages}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setParentPage((p) => Math.max(1, p - 1))}
                  disabled={safeParentPage === 1}
                  className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-50"
                >
                  {lang === "ar" ? "السابق" : "Prev"}
                </button>
                <button
                  onClick={() => setParentPage((p) => Math.min(parentTotalPages, p + 1))}
                  disabled={safeParentPage === parentTotalPages}
                  className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-50"
                >
                  {lang === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
