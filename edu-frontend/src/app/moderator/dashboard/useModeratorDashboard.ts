// src/app/moderator/dashboard/useModeratorDashboard.ts
// ============================================================================
// Moderator Dashboard Hook
// ----------------------------------------------------------------------------
// - Role guard: localStorage (fast) + session endpoint (authoritative)
// - Loads sessions, students, teachers, homework, quizzes
// - Provides markAttendanceExcused handler
// ============================================================================

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang, ModeratorUser, TabKey } from "./moderatorTypes";
import type { LangTexts } from "./moderatorTexts";
import {
  getModeratorLessonSessions,
  getModeratorStudents,
  getModeratorTeachers,
  getModeratorHomework,
  getModeratorQuizzes,
  markAttendanceExcused as apiMarkExcused,
} from "@/src/services/moderatorService";
import type {
  ModeratorSessionRow,
  ModeratorStudentRow,
  ModeratorTeacherRow,
  ModeratorHomeworkRow,
  ModeratorQuizRow,
} from "@/src/services/moderatorService";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export function useModeratorDashboard(lang: Lang, t: LangTexts) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  // -------------------------------------------------------------------------
  // Role guard state
  // -------------------------------------------------------------------------
  const [moderatorUser, setModeratorUser] = useState<ModeratorUser | null>(null);
  const [localChecked, setLocalChecked] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionIsModerator, setSessionIsModerator] = useState<boolean | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("sessions");

  // -------------------------------------------------------------------------
  // Data state
  // -------------------------------------------------------------------------
  const [sessions, setSessions] = useState<ModeratorSessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [students, setStudents] = useState<ModeratorStudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<ModeratorTeacherRow[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  const [homework, setHomework] = useState<ModeratorHomeworkRow[]>([]);
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);

  const [quizzes, setQuizzes] = useState<ModeratorQuizRow[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Role guard: localStorage (fast hint only)
  // -------------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("edu-user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as ModeratorUser;
      setModeratorUser(parsed);
    } catch {
      // ignore
    } finally {
      setLocalChecked(true);
    }
  }, []);

  const localIsModerator = useMemo(() => {
    return !!moderatorUser && moderatorUser.role.toLowerCase() === "moderator";
  }, [moderatorUser]);

  // -------------------------------------------------------------------------
  // Session-truth moderator check (calls a moderator endpoint)
  // -------------------------------------------------------------------------
  const checkModeratorSession = useCallback(async () => {
    setSessionError(null);
    try {
      // Using sessions as the role-verification call — if it succeeds, we're a moderator
      const data = await getModeratorLessonSessions();
      setSessions(data);
      setSessionIsModerator(true);
    } catch {
      setSessionIsModerator(false);
      setSessionError(
        lang === "ar"
          ? "جلسة المشرف المساعد غير صالحة. الرجاء تسجيل الدخول مرة أخرى."
          : "Moderator session is not valid. Please login again."
      );
    } finally {
      setSessionChecked(true);
    }
  }, [lang]);

  useEffect(() => {
    if (localChecked) {
      void checkModeratorSession();
    }
  }, [localChecked, checkModeratorSession]);

  const checkedRole = sessionChecked;
  const isModerator = sessionIsModerator === true;

  // -------------------------------------------------------------------------
  // Data loaders
  // -------------------------------------------------------------------------
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await getModeratorLessonSessions();
      setSessions(data);
    } catch (err) {
      setSessionsError(getErrorMessage(err, t.sessionsNone));
    } finally {
      setSessionsLoading(false);
    }
  }, [t]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const data = await getModeratorStudents();
      setStudents(data);
    } catch (err) {
      setStudentsError(getErrorMessage(err, t.studentsNone));
    } finally {
      setStudentsLoading(false);
    }
  }, [t]);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    setTeachersError(null);
    try {
      const data = await getModeratorTeachers();
      setTeachers(data);
    } catch (err) {
      setTeachersError(getErrorMessage(err, t.teachersNone));
    } finally {
      setTeachersLoading(false);
    }
  }, [t]);

  const loadHomework = useCallback(async () => {
    setHomeworkLoading(true);
    setHomeworkError(null);
    try {
      const data = await getModeratorHomework();
      setHomework(data);
    } catch (err) {
      setHomeworkError(getErrorMessage(err, t.homeworkNone));
    } finally {
      setHomeworkLoading(false);
    }
  }, [t]);

  const loadQuizzes = useCallback(async () => {
    setQuizzesLoading(true);
    setQuizzesError(null);
    try {
      const data = await getModeratorQuizzes();
      setQuizzes(data);
    } catch (err) {
      setQuizzesError(getErrorMessage(err, t.quizzesNone));
    } finally {
      setQuizzesLoading(false);
    }
  }, [t]);

  // Load data when role is confirmed
  useEffect(() => {
    if (!isModerator) return;
    // Sessions already loaded during role check
    void loadStudents();
    void loadTeachers();
    void loadHomework();
    void loadQuizzes();
  }, [isModerator, loadStudents, loadTeachers, loadHomework, loadQuizzes]);

  // -------------------------------------------------------------------------
  // Mark attendance as excused
  // -------------------------------------------------------------------------
  const markExcused = useCallback(
    async (sessionId: number, studentId: number): Promise<void> => {
      await apiMarkExcused(sessionId, studentId);
      // Optimistically update the local sessions state
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s } : s
        )
      );
    },
    []
  );

  return {
    dir,
    lang,
    localIsModerator,
    localChecked,
    checkedRole,
    isModerator,
    sessionError,
    activeTab,
    setActiveTab,

    sessions,
    sessionsLoading,
    sessionsError,
    loadSessions,

    students,
    studentsLoading,
    studentsError,
    loadStudents,

    teachers,
    teachersLoading,
    teachersError,
    loadTeachers,

    homework,
    homeworkLoading,
    homeworkError,
    loadHomework,

    quizzes,
    quizzesLoading,
    quizzesError,
    loadQuizzes,

    markExcused,
  };
}
