"use client";

/**
 * ============================================================================
 * Admin Dashboard Page
 * ----------------------------------------------------------------------------
 * FIXES IMPLEMENTED:
 * 1) ✅ Fixed `t.tabs` index mapping bug - added null guard for undefined keys
 * 2) ✅ Fixed RTL spacing for mobile tabs - uses `space-x-reverse` when dir="rtl"
 * 3) ✅ Fixed sidebar active border for RTL - border moves to right side
 * 4) ✅ Added minimum height to dashboard area - prevents layout crushing
 * 5) ✅ Minor cleanup: Updated "users" icon to UserCog for better distinction
 *
 * NEW (Notifications separation):
 * 6) ✅ Added "notifications" tab key + rendering NotificationsPanel separately
 * 7) ✅ Removed notifications props from AnnouncementsPanel (announcements-only)
 *
 * NOTES:
 * - This file is layout + routing only (NO business logic).
 * - No prop spreading.
 * - Dashboard area uses constrained height between Navbar/Footer via CSS vars.
 * ============================================================================
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { texts } from "./adminTexts";
import type { Lang, TabKey } from "./adminTypes";
import { useAdminDashboard } from "./useAdminDashboard";

// Lucide icons
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BadgeCheck,
  ClipboardCheck,
  CalendarDays,
  Clock,
  Megaphone,
  Inbox,
  Settings,
  UserCog,
  ShieldCheck,
} from "lucide-react";

// Panels
import { OverviewPanel } from "./components/OverviewPanel";
import { SubjectsPanel } from "./components/SubjectsPanel";
import { TeachersPanel } from "./components/TeachersPanel";
import { TeacherApprovalsPanel } from "./components/TeacherApprovalsPanel";
import { AssignmentsPanel } from "./components/AssignmentsPanel";
import { SchedulesPanel } from "./components/SchedulesPanel";
import { AdminLessonSessionsPanel } from "./components/AdminLessonSessionsPanel";
import NotificationsPanel from "./components/NotificationsPanel";
import AnnouncementsPanel from "./components/AnnouncementsPanel";
import { RequestsPanel } from "./components/RequestsPanel";
import { UsersPanel } from "./components/UsersPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ModeratorsPanel } from "./components/ModeratorsPanel";

function AdminDashboardPageContent() {
  // ---------------------------------------------------------------------------
  // Language
  // ---------------------------------------------------------------------------
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = texts[lang];

  // ---------------------------------------------------------------------------
  // Dashboard hook (ALL state + handlers)
  // ---------------------------------------------------------------------------
  const d = useAdminDashboard(lang, t);
  const { dir, checkedRole, isAdmin, activeTab, setActiveTab } = d;

  // ---------------------------------------------------------------------------
  // Tabs order MUST match adminTexts.ts
  // IMPORTANT:
  // - If you added "Notifications" label in adminTexts tabs after "Announcements",
  //   you MUST add "notifications" here at the same index.
  // ---------------------------------------------------------------------------
  const TAB_KEYS: readonly TabKey[] = useMemo(
    () => [
      "overview",
      "subjects",
      "teachers",
      "approvals",
      "assignments",
      "schedules",
      "sessions",
      "announcements",
      "notifications",
      "requests",
      "users",
      "moderators", // ✅ must align with adminTexts.ts tabs
      "settings",
    ],
    []
  );

  // ---------------------------------------------------------------------------
  // Icons mapping (Lucide)
  // ---------------------------------------------------------------------------
  const getTabIcon = (key: TabKey) => {
    const cls = "h-5 w-5";

    switch (key) {
      case "overview":
        return <LayoutDashboard className={cls} />;
      case "subjects":
        return <BookOpen className={cls} />;
      case "teachers":
        return <Users className={cls} />;
      case "approvals":
        return <BadgeCheck className={cls} />;
      case "assignments":
        return <ClipboardCheck className={cls} />;
      case "schedules":
        return <CalendarDays className={cls} />;
      case "sessions":
        return <Clock className={cls} />;
      case "announcements":
        return <Megaphone className={cls} />;
      case "notifications":
        return <Inbox className={cls} />; // ✅ You can swap to Bell if preferred
      case "requests":
        return <Inbox className={cls} />;
      case "users":
        return <UserCog className={cls} />;
      case "moderators":
        return <ShieldCheck className={cls} />;
      case "settings":
        return <Settings className={cls} />;
      default:
        return <LayoutDashboard className={cls} />;
    }
  };

  // ---------------------------------------------------------------------------
  // Guards
  // ---------------------------------------------------------------------------
  if (!checkedRole) {
    return <div className="p-10 text-center text-slate-500">{t.loading}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t.notAdminTitle}</h1>
        <p className="mt-4 text-slate-600">{t.notAdminBody}</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Layout sizing helpers
  // ---------------------------------------------------------------------------
  const DASHBOARD_AREA_H =
    "min-h-[400px] h-[calc(100svh-var(--app-header-h,64px)-var(--app-footer-h,64px))]";

  const iconGapClass = dir === "rtl" ? "ml-3" : "mr-3";

  const activeBorderClass =
    dir === "rtl" ? "border-r-4 border-emerald-500" : "border-l-4 border-emerald-500";

  const idleBorderClass =
    dir === "rtl" ? "border-r-4 border-transparent" : "border-l-4 border-transparent";

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------
  return (
    <main className="bg-gray-50" dir={dir}>
      <div className="mx-auto w-full px-[25px]">
        <div className={["flex flex-col lg:flex-row gap-6 py-4 overflow-hidden", DASHBOARD_AREA_H].join(" ")}>
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="h-full rounded-xl border border-gray-200 bg-white overflow-y-auto">
              <div className="px-4 pt-5 pb-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900">{t.pageTitle}</h1>
                <p className="text-sm text-gray-500">{t.pageSubtitle}</p>
              </div>

              <nav className="px-2 py-3 space-y-1">
                {t.tabs.map((label, index) => {
                  const key = TAB_KEYS[index];
                  if (!key) return null;

                  const isActive = activeTab === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={[
                        "group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                        isActive
                          ? `bg-emerald-50 text-emerald-700 ${activeBorderClass}`
                          : `text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${idleBorderClass}`,
                      ].join(" ")}
                    >
                      <div
                        className={[
                          iconGapClass,
                          "shrink-0",
                          isActive ? "text-emerald-500" : "text-gray-400 group-hover:text-gray-500",
                        ].join(" ")}
                      >
                        {getTabIcon(key)}
                      </div>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <div className="lg:hidden shrink-0 rounded-xl border border-gray-200 bg-white">
              <div className="px-4 py-4">
                <h1 className="text-lg font-semibold text-gray-900">{t.pageTitle}</h1>
                <p className="text-xs text-gray-500">{t.pageSubtitle}</p>
              </div>

              {/* Mobile tabs (two rows) */}
              <div className="px-4 pb-4">
                <div
                  className={[
                    "flex overflow-x-auto pb-2",
                    dir === "rtl" ? "space-x-reverse space-x-2" : "space-x-2",
                  ].join(" ")}
                >
                  {t.tabs.slice(0, 5).map((label, index) => {
                    const key = TAB_KEYS[index];
                    if (!key) return null;

                    const isActive = activeTab === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={[
                          "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap",
                          isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        <div className="mb-1">{getTabIcon(key)}</div>
                        <span>{label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className={[
                    "flex overflow-x-auto pb-1 mt-2",
                    dir === "rtl" ? "space-x-reverse space-x-2" : "space-x-2",
                  ].join(" ")}
                >
                  {t.tabs.slice(5).map((label, index) => {
                    const key = TAB_KEYS[index + 5];
                    if (!key) return null;

                    const isActive = activeTab === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={[
                          "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap",
                          isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        <div className="mb-1">{getTabIcon(key)}</div>
                        <span>{label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Panels (scroll area) */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {activeTab === "overview" && (
                <OverviewPanel
                  lang={lang}
                  t={t}
                  overview={d.overview}
                  overviewLoading={d.overviewLoading}
                  overviewError={d.overviewError}
                  loadOverview={d.loadOverview}
                  students={d.students}
                  teachers={d.teachers}
                  requests={d.requests}
                  pendingTeachers={d.pendingTeachers}
                />
              )}

              {activeTab === "subjects" && (
                <SubjectsPanel
                  lang={lang}
                  t={t}
                  subjects={d.subjects}
                  subjectsLoading={d.subjectsLoading}
                  subjectsError={d.subjectsError}
                  loadSubjects={d.loadSubjects}
                  newSubNameAr={d.newSubNameAr}
                  newSubNameEn={d.newSubNameEn}
                  newSubSort={d.newSubSort}
                  newSubActive={d.newSubActive}
                  creatingSubject={d.creatingSubject}
                  creatingSubjectError={d.creatingSubjectError}
                  editingSubjectId={d.editingSubjectId}
                  editSubNameAr={d.editSubNameAr}
                  editSubNameEn={d.editSubNameEn}
                  editSubSort={d.editSubSort}
                  editSubActive={d.editSubActive}
                  updatingSubject={d.updatingSubject}
                  updatingSubjectError={d.updatingSubjectError}
                  deletingSubjectId={d.deletingSubjectId}
                  deletingSubjectError={d.deletingSubjectError}
                  subjectMessage={d.subjectMessage}
                  handleCreateSubject={d.handleCreateSubject}
                  startEditSubject={d.startEditSubject}
                  cancelEditSubject={d.cancelEditSubject}
                  handleUpdateSubject={d.handleUpdateSubject}
                  handleDeleteSubject={d.handleDeleteSubject}
                  setNewSubNameAr={d.setNewSubNameAr}
                  setNewSubNameEn={d.setNewSubNameEn}
                  setNewSubSort={d.setNewSubSort}
                  setNewSubActive={d.setNewSubActive}
                  setEditSubNameAr={d.setEditSubNameAr}
                  setEditSubNameEn={d.setEditSubNameEn}
                  setEditSubSort={d.setEditSubSort}
                  setEditSubActive={d.setEditSubActive}
                />
              )}

              {activeTab === "teachers" && (
                <TeachersPanel
                  lang={lang}
                  t={t}
                  teachers={d.teachers}
                  teachersLoading={d.teachersLoading}
                  teachersError={d.teachersError}
                  loadTeachers={d.loadTeachers}
                  newTeacherName={d.newTeacherName}
                  newTeacherBio={d.newTeacherBio}
                  newTeacherGender={d.newTeacherGender}
                  newTeacherPhotoUrl={d.newTeacherPhotoUrl}
                  newTeacherActive={d.newTeacherActive}
                  creatingTeacher={d.creatingTeacher}
                  creatingTeacherError={d.creatingTeacherError}
                  teacherMessage={d.teacherMessage}
                  setNewTeacherName={d.setNewTeacherName}
                  setNewTeacherBio={d.setNewTeacherBio}
                  setNewTeacherGender={d.setNewTeacherGender}
                  setNewTeacherPhotoUrl={d.setNewTeacherPhotoUrl}
                  setNewTeacherActive={d.setNewTeacherActive}
                  handleCreateTeacher={d.handleCreateTeacher}
                  subjects={d.subjects}
                  assignTeacherId={d.assignTeacherId}
                  assignSubjectId={d.assignSubjectId}
                  assignPriority={d.assignPriority}
                  assigning={d.assigning}
                  assignError={d.assignError}
                  assignSuccess={d.assignSuccess}
                  assignSubjectsLoading={d.assignSubjectsLoading}
                  assignSubjectsError={d.assignSubjectsError}
                  setAssignTeacherId={d.setAssignTeacherId}
                  setAssignSubjectId={d.setAssignSubjectId}
                  setAssignPriority={d.setAssignPriority}
                  handleAssignTeacher={d.handleAssignTeacher}
                  loadAssignSubjects={d.loadAssignSubjects}
                  updatingTeacherId={d.updatingTeacherId}
                  updatingTeacherError={d.updatingTeacherError}
                  toggleTeacherActive={d.toggleTeacherActive}
                />
              )}

              {activeTab === "approvals" && (
                <TeacherApprovalsPanel
                  lang={lang}
                  t={t}
                  pendingTeachers={d.pendingTeachers}
                  pendingTeachersLoading={d.pendingTeachersLoading}
                  pendingTeachersError={d.pendingTeachersError}
                  approvingTeacherId={d.approvingTeacherId}
                  rejectingTeacherId={d.rejectingTeacherId}
                  updatingCapacityTeacherId={d.updatingCapacityTeacherId}
                  onApproveTeacher={d.approveTeacher}
                  onRejectTeacher={d.rejectTeacher}
                  onUpdateTeacherCapacity={d.updateTeacherCapacity}
                  loadPendingTeachers={d.loadPendingTeachers}
                />
              )}

              {activeTab === "assignments" && (
                <AssignmentsPanel
                  lang={lang}
                  t={t}
                  assignments={d.teacherAssignments}
                  assignmentsLoading={d.teacherAssignmentsLoading}
                  assignmentsError={d.teacherAssignmentsError}
                  onReassignStudent={d.reassignStudentTeacher}
                />
              )}

              {activeTab === "schedules" && (
                <SchedulesPanel
                  lang={lang}
                  t={t}
                  schedules={d.teacherSchedules}
                  schedulesLoading={d.teacherSchedulesLoading}
                  schedulesError={d.teacherSchedulesError}
                  onCreateSchedule={d.createTeacherSchedule}
                  onUpdateSchedule={d.updateTeacherSchedule}
                  onDeleteSchedule={d.deleteTeacherSchedule}
                />
              )}

              {activeTab === "sessions" && (
                <AdminLessonSessionsPanel
                  lang={lang}
                  t={t}
                  sessions={d.lessonSessions}
                  loading={d.lessonSessionsLoading}
                  error={d.lessonSessionsError}
                  onRefresh={d.loadLessonSessions}
                />
              )}

              {/* ✅ Announcements-only panel */}
              {activeTab === "announcements" && (
                <AnnouncementsPanel
                  lang={lang}
                  t={t}
                  announcements={d.announcements}
                  loading={d.announcementsLoading}
                  error={d.announcementsError}
                  onCreate={d.createAnnouncement}
                  onRefresh={d.loadAnnouncements}
                />
              )}

              {/* ✅ Notifications-only panel */}
              {activeTab === "notifications" && (
                <NotificationsPanel
                  lang={lang}
                  t={t}
                  inbox={d.adminNotifications}
                  loading={d.adminNotificationsLoading}
                  error={d.adminNotificationsError}
                  onRefresh={d.loadAdminNotifications}
                  onMarkRead={d.markAdminNotificationRead}
                  onMarkAllRead={d.markAllAdminNotificationsRead}
                />
              )}

              {activeTab === "requests" && (
                <RequestsPanel
                  lang={lang}
                  t={t}
                  requests={d.requests}
                  requestsLoading={d.requestsLoading}
                  requestsError={d.requestsError}
                  approvingId={d.approvingId}
                  rejectingId={d.rejectingId}
                  handleApproveRequest={d.handleApproveRequest}
                  handleRejectRequest={d.handleRejectRequest}
                />
              )}

              {activeTab === "users" && (
                <UsersPanel
                  lang={lang}
                  t={t}
                  students={d.students}
                  parents={d.parents}
                  studentsLoading={d.studentsLoading}
                  parentsLoading={d.parentsLoading}
                  studentsError={d.studentsError}
                  parentsError={d.parentsError}
                  loadStudents={d.loadStudents}
                  loadParents={d.loadParents}
                  updatingUserId={d.updatingUserId}
                  userActionError={d.userActionError}
                  toggleUserActive={d.toggleUserActive}
                  parentStudentLinks={d.parentStudentLinks}
                  parentStudentLinksLoading={d.parentStudentLinksLoading}
                  parentStudentLinksError={d.parentStudentLinksError}
                  creatingLink={d.creatingLink}
                  creatingLinkError={d.creatingLinkError}
                  deletingLinkId={d.deletingLinkId}
                  deletingLinkError={d.deletingLinkError}
                  onCreateLink={d.createParentStudentLink}
                  onDeleteLink={d.deleteParentStudentLink}
                  loadParentStudentLinks={d.loadParentStudentLinks}
                />
              )}

              {activeTab === "moderators" && (
                <ModeratorsPanel
                  lang={lang}
                  t={t}
                  moderators={d.moderators}
                  moderatorsLoading={d.moderatorsLoading}
                  moderatorsError={d.moderatorsError}
                  loadModerators={d.loadModerators}
                  creatingModerator={d.creatingModerator}
                  creatingModeratorError={d.creatingModeratorError}
                  moderatorMessage={d.moderatorMessage}
                  onCreateModerator={d.handleCreateModerator}
                />
              )}

              {activeTab === "settings" && (
                <SettingsPanel
                  lang={lang}
                  t={t}
                  settings={d.adminSettings}
                  settingsLoading={d.adminSettingsLoading}
                  settingsError={d.adminSettingsError}
                  onUpdateSettings={d.updateAdminSettings}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AdminDashboardPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-slate-500">Loading admin dashboard...</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardPageFallback />}>
      <AdminDashboardPageContent />
    </Suspense>
  );
}
