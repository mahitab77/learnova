"use client";

// ============================================================================
// Moderator Dashboard Page
// ----------------------------------------------------------------------------
// - Role guard: shows access-denied if not moderator
// - 5 tabs: Sessions, Students, Teachers, Homework, Quizzes
// - Sidebar layout matching admin dashboard style
// - Wrapped in Suspense because useSearchParams() is used in a client page
// ============================================================================

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { texts } from "./moderatorTexts";
import type { Lang, TabKey } from "./moderatorTypes";
import { useModeratorDashboard } from "./useModeratorDashboard";

import { Clock, Users, BookOpen, ClipboardList, FileQuestion } from "lucide-react";

import { ModeratorSessionsPanel } from "./components/ModeratorSessionsPanel";
import { ModeratorStudentsPanel } from "./components/ModeratorStudentsPanel";
import { ModeratorTeachersPanel } from "./components/ModeratorTeachersPanel";
import { ModeratorHomeworkPanel } from "./components/ModeratorHomeworkPanel";
import { ModeratorQuizzesPanel } from "./components/ModeratorQuizzesPanel";

function ModeratorDashboardFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm">Loading moderator dashboard...</p>
    </div>
  );
}

function ModeratorDashboardContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = texts[lang];

  const d = useModeratorDashboard(lang, t);
  const {
    dir,
    checkedRole,
    isModerator,
    sessionError,
    activeTab,
    setActiveTab,
  } = d;

  const TAB_KEYS: readonly TabKey[] = useMemo(
    () => ["sessions", "students", "teachers", "homework", "quizzes"],
    []
  );

  const getTabIcon = (key: TabKey) => {
    const cls = "h-5 w-5";
    switch (key) {
      case "sessions":
        return <Clock className={cls} />;
      case "students":
        return <Users className={cls} />;
      case "teachers":
        return <BookOpen className={cls} />;
      case "homework":
        return <ClipboardList className={cls} />;
      case "quizzes":
        return <FileQuestion className={cls} />;
      default:
        return null;
    }
  };

  if (!checkedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">{t.loading}</p>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-2xl bg-white border border-slate-100 shadow-sm p-8 text-center space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">{t.notModeratorTitle}</h1>
          <p className="text-sm text-slate-500">{t.notModeratorBody}</p>
          {sessionError && (
            <p className="text-xs text-red-600 mt-2">{sessionError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-900">{t.pageTitle}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{t.pageSubtitle}</p>
      </div>

      <div className="flex min-h-[calc(100vh-5rem)]">
        <aside className="w-56 shrink-0 bg-white border-e border-slate-100 py-4 hidden md:block">
          <nav className="space-y-1 px-2">
            {TAB_KEYS.map((key, i) => {
              const label = t.tabs[i];
              const isActive = activeTab === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-s-2 border-emerald-500"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {getTabIcon(key)}
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex z-10">
          {TAB_KEYS.map((key, i) => {
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center py-2 text-[10px] gap-0.5 transition-colors ${
                  isActive ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {getTabIcon(key)}
                <span>{t.tabs[i]}</span>
              </button>
            );
          })}
        </div>

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          {activeTab === "sessions" && (
            <ModeratorSessionsPanel
              lang={lang}
              t={t}
              sessions={d.sessions}
              loading={d.sessionsLoading}
              error={d.sessionsError}
              onRefresh={d.loadSessions}
              onMarkExcused={d.markExcused}
            />
          )}

          {activeTab === "students" && (
            <ModeratorStudentsPanel
              lang={lang}
              t={t}
              students={d.students}
              loading={d.studentsLoading}
              error={d.studentsError}
              onRefresh={d.loadStudents}
            />
          )}

          {activeTab === "teachers" && (
            <ModeratorTeachersPanel
              lang={lang}
              t={t}
              teachers={d.teachers}
              loading={d.teachersLoading}
              error={d.teachersError}
              onRefresh={d.loadTeachers}
            />
          )}

          {activeTab === "homework" && (
            <ModeratorHomeworkPanel
              lang={lang}
              t={t}
              homework={d.homework}
              loading={d.homeworkLoading}
              error={d.homeworkError}
              onRefresh={d.loadHomework}
            />
          )}

          {activeTab === "quizzes" && (
            <ModeratorQuizzesPanel
              lang={lang}
              t={t}
              quizzes={d.quizzes}
              loading={d.quizzesLoading}
              error={d.quizzesError}
              onRefresh={d.loadQuizzes}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function ModeratorDashboardPage() {
  return (
    <Suspense fallback={<ModeratorDashboardFallback />}>
      <ModeratorDashboardContent />
    </Suspense>
  );
}