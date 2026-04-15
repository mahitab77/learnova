// src/app/teacher/dashboard/page.tsx
"use client";

/**
 * =============================================================================
 * Teacher Dashboard Page
 * -----------------------------------------------------------------------------
 * ✅ Sidebar top: remove name/email/status entirely (desktop + mobile)
 * ✅ Main content: add top header card with name/email LEFT and status RIGHT
 * ✅ No refresh button
 * ✅ No quiz type hacks here (due_at is now part of QuizRow type)
 * =============================================================================
 */

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang, TeacherDashboardTabId } from "./teacherDashboardTypes";
import { useTeacherDashboard } from "./useTeacherDashboard";

// Panels (DEFAULT exports)
import TeacherOverviewPanel from "./panels/TeacherOverviewPanel";
import TeacherSessionsPanel from "./panels/TeacherSessionsPanel";
import TeacherStudentsPanel from "./panels/TeacherStudentsPanel";
import TeacherHomeworkPanel from "./panels/TeacherHomeworkPanel";
import TeacherQuizzesPanel from "./panels/TeacherQuizzesPanel";
import TeacherSchedulePanel from "./panels/TeacherSchedulePanel";
import TeacherExceptionsPanel from "./panels/TeacherExceptionsPanel";
import TeacherProfilePanel from "./panels/TeacherProfilePanel";
import TeacherMessagesPanel from "./panels/TeacherMessagesPanel";
import TeacherLessonRequestsPanel from "./panels/TeacherLessonRequestsPanel";

// Modals (DEFAULT exports)
import SessionDetailsModal from "./modals/SessionDetailsModal";
import HomeworkModal from "./modals/HomeworkModal";
import QuizModal from "./modals/QuizModal";
import SubmissionsModal from "./modals/SubmissionsModal";
import GradeSubmissionModal from "./modals/GradeSubmissionModal";
import SlotOfferingsModal from "./modals/SlotOfferingsModal";

import { teacherDashboardTexts } from "./teacherDashboardTexts";

// Icons
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  BookOpen,
  AlertTriangle,
  Settings,
  CheckCircle2,
  X,
  AlertOctagon,
  Bell,
  ClipboardCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* CSV Export Helpers (Local Implementation)                                  */
/* -------------------------------------------------------------------------- */

function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function toCsvValue(v: unknown): string {
  const s =
    v === null || v === undefined
      ? ""
      : typeof v === "string"
        ? v
        : typeof v === "number" || typeof v === "boolean"
          ? String(v)
          : JSON.stringify(v);

  const needsWrap = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

function exportRowsAsCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    downloadCsv(filename, "");
    return;
  }
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.map(toCsvValue).join(","),
    ...rows.map((r) => headers.map((h) => toCsvValue(r[h])).join(",")),
  ];
  downloadCsv(filename, lines.join("\n"));
}

/* -------------------------------------------------------------------------- */
/* General Helpers                                                            */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type TabMeta = { id: TeacherDashboardTabId; label: string; icon: ReactNode };

// Exception type adapter
type UiExceptionType = "unavailable" | "extra_available";
type PanelExceptionType = "block" | "add";

function toPanelExceptionType(x: UiExceptionType | PanelExceptionType): PanelExceptionType {
  if (x === "unavailable") return "block";
  if (x === "extra_available") return "add";
  return x;
}

function toUiExceptionType(x: UiExceptionType | PanelExceptionType): UiExceptionType {
  if (x === "block") return "unavailable";
  if (x === "add") return "extra_available";
  return x;
}

/* -------------------------------------------------------------------------- */
/* Page Component                                                             */
/* -------------------------------------------------------------------------- */

function TeacherDashboardPageContent() {
  const sp = useSearchParams();
  const lang: Lang = sp.get("lang") === "ar" ? "ar" : "en";
  const t = teacherDashboardTexts[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const dash = useTeacherDashboard({ lang });

  // Local CSV export
  const onExportCSV = <T extends Record<string, unknown>>(rows: T[], filename: string) => {
    if (!Array.isArray(rows)) {
      console.warn("onExportCSV: rows is not an array");
      return;
    }

    const safeRows = rows.filter(
      (x): x is T => x !== null && typeof x === "object" && !Array.isArray(x)
    );

    const date = new Date().toISOString().slice(0, 10);
    const finalFilename = filename.trim() || `export-${date}.csv`;
    exportRowsAsCsv(finalFilename, safeRows as Array<Record<string, unknown>>);
  };

  // Tabs
  const tabs: TabMeta[] = useMemo(
    () => [
      { id: "overview", label: lang === "ar" ? "نظرة عامة" : "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
      { id: "sessions", label: lang === "ar" ? "الحصص" : "Sessions", icon: <CalendarDays className="h-5 w-5" /> },
      { id: "students", label: lang === "ar" ? "الطلاب" : "Students", icon: <Users className="h-5 w-5" /> },
      { id: "homework", label: lang === "ar" ? "الواجبات" : "Homework", icon: <ClipboardList className="h-5 w-5" /> },
      { id: "quizzes", label: lang === "ar" ? "الاختبارات" : "Quizzes", icon: <BookOpen className="h-5 w-5" /> },
      { id: "schedule", label: lang === "ar" ? "الجدول" : "Schedule", icon: <CalendarDays className="h-5 w-5" /> },
      { id: "exceptions", label: lang === "ar" ? "استثناءات" : "Exceptions", icon: <AlertTriangle className="h-5 w-5" /> },
      { id: "messages", label: lang === "ar" ? "الرسائل" : "Messages", icon: <Bell className="h-5 w-5" /> },
      { id: "lessonRequests", label: lang === "ar" ? "طلبات الحصص" : "Lesson Requests", icon: <ClipboardCheck className="h-5 w-5" /> },
      { id: "profile", label: lang === "ar" ? "الملف الشخصي" : "Profile", icon: <Settings className="h-5 w-5" /> },
    ],
    [lang]
  );

  const [activeTab, setActiveTab] = useState<TeacherDashboardTabId>("overview");

  // Layout helpers
  const DASHBOARD_AREA_H =
    "h-[calc(100svh-var(--app-header-h,64px)-var(--app-footer-h,64px))]";

  const iconGapClass = dir === "rtl" ? "ml-3" : "mr-3";
  const activeEdgeBorder = dir === "rtl" ? "border-r-4" : "border-l-4";

  const pageTitle = lang === "ar" ? "لوحة المعلم" : "Teacher Dashboard";

  // Theme
  const TEACHER_ACTIVE_BG = "bg-sky-50";
  const TEACHER_ACTIVE_TEXT = "text-sky-700";
  const TEACHER_ACTIVE_BORDER = "border-sky-500";
  const TEACHER_ACTIVE_ICON = "text-sky-500";
  const TEACHER_INACTIVE_ICON = "text-gray-400 group-hover:text-gray-500";
  const TEACHER_BUTTON_PRIMARY = "bg-sky-500 hover:bg-sky-600";

  // Exceptions adapter
  const exFormForPanel = {
    ...dash.exForm,
    exception_type: toPanelExceptionType(dash.exForm.exception_type),
  };

  const onExFormChangeForPanel: React.Dispatch<React.SetStateAction<typeof exFormForPanel>> =
    (next) => {
      dash.setExForm((prev) => {
        const prevForPanel = {
          ...prev,
          exception_type: toPanelExceptionType(prev.exception_type),
        };
        const resolved = typeof next === "function" ? next(prevForPanel) : next;
        return {
          ...prev,
          ...resolved,
          exception_type: toUiExceptionType(resolved.exception_type),
        };
      });
    };

  // Quiz modal save adapter
  const onSaveQuizFromModal = async (payload: {
    subject_id: number;
    title: string;
    description: string | null;
    due_at: string;
    max_score: number | null;
    quiz_url: string | null;
    is_active: number;
  }) => {
    const nowSql = new Date().toISOString().slice(0, 19).replace("T", " ");
    await dash.saveQuiz({
      subject_id: payload.subject_id,
      title: payload.title,
      description: payload.description,
      available_from: nowSql,
      available_until: payload.due_at,
      time_limit_min: null,
      max_score: payload.max_score,
      is_active: payload.is_active,
    });
  };

  // Normalize submissions nullability
  const homeworkSubsForModal =
    dash.homeworkSubmissions?.map((row) => ({ ...row, submitted_at: row.submitted_at ?? null })) ??
    null;

  const quizSubsForModal =
    dash.quizSubmissions?.map((row) => ({
      ...row,
      submission_url: row.submission_url ?? null,
      submitted_at: row.submitted_at ?? null,
    })) ?? null;

  const activeSlotOfferings =
    dash.activeOfferingScheduleId == null
      ? []
      : dash.getOfferingsForSlot(dash.activeOfferingScheduleId);

  // Main header data
  const teacherName = (dash.profile?.name ?? dash.profile?.user_full_name ?? "-") || "-";
  const teacherEmail = dash.profile?.user_email ?? "";
  const teacherStatus = dash.profile?.status ?? "";

  return (
    <main className="bg-gray-50" dir={dir}>
      <div className="mx-auto w-full px-3 sm:px-4 lg:px-5">
        <div
          className={cx(
            "flex flex-col lg:flex-row gap-6 py-4 overflow-hidden",
            DASHBOARD_AREA_H
          )}
        >
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="h-full rounded-xl border border-gray-200 bg-white overflow-y-auto">
              {/* Header */}
              <div className="px-4 pt-5 pb-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>

                {/* ✅ REMOVED: identity block from sidebar completely */}
              </div>

              {/* Navigation */}
              <nav className="px-2 py-3 space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cx(
                        "group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                        activeEdgeBorder,
                        isActive
                          ? cx(TEACHER_ACTIVE_BG, TEACHER_ACTIVE_TEXT, TEACHER_ACTIVE_BORDER)
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-transparent"
                      )}
                    >
                      <div
                        className={cx(
                          iconGapClass,
                          "shrink-0",
                          isActive ? TEACHER_ACTIVE_ICON : TEACHER_INACTIVE_ICON
                        )}
                      >
                        {tab.icon}
                      </div>
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Mobile header + tabs */}
            <div className="lg:hidden shrink-0 rounded-xl border border-gray-200 bg-white">
              <div className="px-4 py-4">
                {/* ✅ REMOVED: identity block from mobile header */}
                <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
              </div>

              <div className="px-4 pb-4">
                <div className="flex overflow-x-auto pb-2 space-x-2">
                  {tabs.slice(0, 5).map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cx(
                          "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap",
                          isActive
                            ? cx(TEACHER_BUTTON_PRIMARY, "text-white")
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                      >
                        <div className="mb-1">{tab.icon}</div>
                        <span>{lang === "ar" ? tab.label : tab.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex overflow-x-auto pb-1 space-x-2 mt-2">
                  {tabs.slice(5).map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cx(
                          "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap",
                          isActive
                            ? cx(TEACHER_BUTTON_PRIMARY, "text-white")
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                      >
                        <div className="mb-1">{tab.icon}</div>
                        <span>{lang === "ar" ? tab.label : tab.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ✅ MAIN TOP HEADER CARD (matches your screenshot style) */}
            {!dash.loading ? (
              <div className="mt-3 lg:mt-0 px-0 lg:px-0">
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  {dash.profile ? (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{teacherName}</div>
                        <div className="text-sm text-gray-600 truncate">{teacherEmail}</div>
                      </div>

                      {teacherStatus ? (() => {
                        const statusMap: Record<string, { label: string; labelAr: string; cls: string; hint?: string; hintAr?: string }> = {
                          approved: {
                            label: "Approved",
                            labelAr: "موافق عليه",
                            cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
                          },
                          pending_review: {
                            label: "Pending Review",
                            labelAr: "قيد المراجعة",
                            cls: "border-amber-200 bg-amber-50 text-amber-700",
                            hint: "Your application is under review. You'll be notified once a decision is made.",
                            hintAr: "طلبك قيد المراجعة. سيتم إخطارك بمجرد اتخاذ القرار.",
                          },
                          rejected: {
                            label: "Not Approved",
                            labelAr: "غير موافق عليه",
                            cls: "border-red-200 bg-red-50 text-red-700",
                            hint: "Your application was not approved. Please contact support for assistance.",
                            hintAr: "لم تتم الموافقة على طلبك. يرجى التواصل مع الدعم للمساعدة.",
                          },
                        };
                        const s = statusMap[teacherStatus] ?? {
                          label: teacherStatus,
                          labelAr: teacherStatus,
                          cls: "border-gray-200 bg-gray-50 text-gray-700",
                        };
                        return (
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
                              {lang === "ar" ? s.labelAr : s.label}
                            </div>
                            {s.hint && (
                              <p className="text-[10px] text-gray-500 text-right max-w-[200px]">
                                {lang === "ar" ? s.hintAr : s.hint}
                              </p>
                            )}
                          </div>
                        );
                      })() : null}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {lang === "ar" ? "جارٍ تحميل الملف..." : "Loading profile..."}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Panels scroll container */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {/* Soft message */}
              {dash.softMsg ? (
                <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-600" />
                    <div className="flex-1">{dash.softMsg}</div>
                    <button
                      type="button"
                      onClick={() => dash.setSoftMsg(null)}
                      className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                      aria-label={lang === "ar" ? "إغلاق" : "Close"}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Fatal error */}
              {dash.fatalError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <div className="flex items-start gap-2">
                    <AlertOctagon className="mt-0.5 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-semibold">
                        {lang === "ar" ? "فشل تحميل لوحة التحكم" : "Failed to load dashboard"}
                      </div>
                      <div className="mt-1 text-xs">{dash.fatalError}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Loading skeletons */}
              {dash.loading ? (
                <div className="space-y-4">
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ) : null}

              {/* Panels */}
              {!dash.loading && activeTab === "overview" ? (
                <TeacherOverviewPanel
                  lang={lang}
                  profile={dash.profile}
                  overview={dash.overview}
                  sessionsToday={dash.sessionsToday}
                  onOpenSessionDetails={dash.openSessionDetails}
                  onExportCSV={onExportCSV}
                />
              ) : null}

              {!dash.loading && activeTab === "sessions" ? (
                <TeacherSessionsPanel
                  lang={lang}
                  q={dash.qSessions}
                  onQChange={dash.setQSessions}
                  sessions={dash.filteredSessions}
                  onOpenSessionDetails={dash.openSessionDetails}
                  onExportCSV={onExportCSV}
                />
              ) : null}

              {!dash.loading && activeTab === "students" ? (
                <TeacherStudentsPanel
                  lang={lang}
                  q={dash.qStudents}
                  onQChange={dash.setQStudents}
                  students={dash.filteredStudents}
                  onExportCSV={onExportCSV}
                />
              ) : null}

              {!dash.loading && activeTab === "homework" ? (
                <TeacherHomeworkPanel
                  lang={lang}
                  q={dash.qHomework}
                  onQChange={dash.setQHomework}
                  rows={dash.filteredHomework}
                  onCreate={dash.openCreateHomework}
                  onEdit={dash.openEditHomework}
                  onOpenSubmissions={dash.openHomeworkSubmissions}
                  onExportCSV={onExportCSV}
                />
              ) : null}

              {!dash.loading && activeTab === "quizzes" ? (
                <TeacherQuizzesPanel
                  lang={lang}
                  q={dash.qQuizzes}
                  onQChange={dash.setQQuizzes}
                  rows={dash.filteredQuizzes}
                  onCreate={dash.openCreateQuiz}
                  onEdit={dash.openEditQuiz}
                  onOpenSubmissions={dash.openQuizSubmissions}
                  onExportCSV={onExportCSV}
                />
              ) : null}

              {!dash.loading && activeTab === "schedule" ? (
                <TeacherSchedulePanel
                  lang={lang}
                  slots={dash.scheduleSlots}
                  slotOfferingsMap={dash.slotOfferingsMap}
                  slotForm={dash.slotForm}
                  onSlotFormChange={dash.setSlotForm}
                  onCreateSlot={dash.createSlot}
                  onToggleActive={dash.toggleSlotActive}
                  onDelete={dash.deleteSlot}
                  onOpenOfferings={dash.openOfferingsModal}
                  buildOfferingSummary={(scheduleId) =>
                    dash.buildOfferingSummary(scheduleId, lang)
                  }
                />
              ) : null}

              {!dash.loading && activeTab === "exceptions" ? (
                <TeacherExceptionsPanel
                  lang={lang}
                  exceptions={dash.exceptions}
                  exForm={exFormForPanel}
                  onExFormChange={onExFormChangeForPanel}
                  onCreateException={dash.createException}
                  onToggleActive={dash.toggleExceptionActive}
                  onDelete={dash.deleteException}
                />
              ) : null}

              {!dash.loading && activeTab === "messages" ? (
                <TeacherMessagesPanel
                  lang={lang}
                  t={t}
                  announcements={dash.announcements}
                  announcementsLoading={dash.announcementsLoading}
                  announcementsError={dash.announcementsError}
                  onRefreshAnnouncements={dash.loadAnnouncements}
                  inbox={dash.notificationsInbox}
                  notificationsLoading={dash.notificationsLoading}
                  notificationsError={dash.notificationsError}
                  onRefreshNotifications={dash.loadNotifications}
                  onMarkRead={dash.markNotificationRead}
                  onMarkAllRead={dash.markAllNotificationsRead}
                />
              ) : null}

              {!dash.loading && activeTab === "lessonRequests" ? (
                <TeacherLessonRequestsPanel
                  lang={lang}
                  t={t}
                  rows={dash.pendingLessonRequests}
                  loading={dash.lessonRequestsLoading}
                  error={dash.lessonRequestsError}
                  onRefresh={dash.loadLessonRequests}
                  onApprove={dash.approveLessonRequest}
                  onReject={dash.rejectLessonRequest}
                />
              ) : null}

              {!dash.loading && activeTab === "profile" ? (
                <TeacherProfilePanel
                  lang={lang}
                  profile={dash.profile}
                  profileForm={dash.profileForm}
                  onProfileFormChange={dash.setProfileForm}
                  onSaveProfile={dash.saveProfile}
                  subjects={dash.teacherSubjects}
                  videos={dash.videos}
                  videoForm={dash.videoForm}
                  onVideoFormChange={dash.setVideoForm}
                  onAddVideo={dash.addVideo}
                  onDeleteVideo={dash.deleteVideo}
                  onSetPrimaryVideo={(videoId) => {
                    const n = typeof videoId === "string" ? Number(videoId) : videoId;
                    if (Number.isFinite(n)) void dash.setPrimaryVideo(n);
                  }}
                />
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      <SessionDetailsModal
        open={dash.sessionDetailsOpen}
        lang={lang}
        loading={dash.sessionDetailsLoading}
        details={dash.sessionDetails}
        onClose={dash.closeSessionDetails}
        onUpdateAttendance={dash.updateAttendance}
        onCancelSession={dash.cancelScheduledSession}
      />

      <HomeworkModal
        open={dash.homeworkModalOpen}
        lang={lang}
        initial={dash.editHomework}
        subjects={dash.teacherSubjects}
        onClose={dash.closeHomeworkModal}
        onSave={dash.saveHomework}
      />

      <QuizModal
        open={dash.quizModalOpen}
        lang={lang}
        initial={dash.editQuiz}
        subjects={dash.teacherSubjects}
        onClose={dash.closeQuizModal}
        onSave={onSaveQuizFromModal}
        onSubmit={onSaveQuizFromModal}
      />

      <SubmissionsModal
        open={dash.submissionsOpen}
        lang={lang}
        title={dash.submissionsTitle}
        loading={dash.submissionsLoading}
        homeworkSubmissions={homeworkSubsForModal}
        quizSubmissions={quizSubsForModal}
        onClose={dash.closeSubmissions}
        onOpenGrade={(x) => dash.openGrade(x)}
      />

      <GradeSubmissionModal
        open={dash.gradeModalOpen}
        lang={lang}
        target={dash.gradeTarget}
        onClose={dash.closeGrade}
        onSave={dash.saveGrade}
      />

      <SlotOfferingsModal
        open={dash.offeringsModalOpen}
        lang={lang}
        slot={dash.activeOfferingScheduleSlot}
        subjects={dash.teacherSubjects}
        systems={dash.gradeCatalog.systems}
        stages={dash.gradeCatalog.stages}
        levels={dash.gradeCatalog.levels}
        initialOfferings={activeSlotOfferings}
        saving={dash.offeringsSaving}
        error={dash.offeringsError}
        onClose={dash.closeOfferingsModal}
        onSave={(offerings) => {
          if (dash.activeOfferingScheduleId == null) return;
          return dash.saveSlotOfferings(dash.activeOfferingScheduleId, offerings);
        }}
      />
    </main>
  );
}

function TeacherDashboardPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading teacher dashboard...</p>
    </div>
  );
}

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<TeacherDashboardPageFallback />}>
      <TeacherDashboardPageContent />
    </Suspense>
  );
}
