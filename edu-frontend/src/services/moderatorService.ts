// src/services/moderatorService.ts
// ============================================================================
// Moderator Service — Session-first (cookie auth)
// ----------------------------------------------------------------------------
// All requests use apiFetch (credentials: "include").
// Moderator is read-only except for marking attendance as "excused".
// ============================================================================

import { apiFetch } from "@/src/lib/api";
import type { ApiFetchOptions } from "@/src/lib/api";

// ---------------------------------------------------------------------------
// Generic API response shape
// ---------------------------------------------------------------------------
type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export type ModeratorSessionRow = {
  id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  is_group: number;
  max_students: number | null;
  created_at: string;
  teacher_id: number;
  teacher_name: string;
  subject_id: number;
  subject_name_en: string;
  subject_name_ar: string;
  created_by_user_id: number | null;
  created_by_name: string | null;
  students_count: number;
};

export type ModeratorSessionStudentRow = {
  student_id: number;
  student_name: string;
  email: string;
  attendance_status: string;
};

export type ModeratorStudentRow = {
  student_id: number;
  user_id: number;
  full_name: string;
  email: string;
  preferred_lang: string | null;
  is_active: number;
  created_at: string;
};

export type ModeratorTeacherRow = {
  id: number;
  name: string;
  bio_short: string | null;
  gender: string | null;
  photo_url: string | null;
  is_active: number;
  created_at: string;
  subjects: string | null;
};

export type ModeratorHomeworkRow = {
  id: number;
  title: string;
  description: string | null;
  due_at: string;
  max_score: number | null;
  is_active: number;
  created_at: string;
  teacher_name: string;
  subject_name_en: string;
  subject_name_ar: string;
};

export type ModeratorQuizRow = {
  id: number;
  title: string;
  description: string | null;
  available_from: string;
  available_until: string;
  time_limit_min: number | null;
  max_score: number | null;
  is_active: number;
  created_at: string;
  teacher_name: string;
  subject_name_en: string;
  subject_name_ar: string;
};

// ---------------------------------------------------------------------------
// Response unwrapper
// ---------------------------------------------------------------------------

async function unwrapData<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch<ApiResponse<T>>(path, options);
  if (!res.success) throw new Error(res.message || "Server error.");
  if (typeof res.data === "undefined") throw new Error("Server error (missing data).");
  return res.data;
}

// ---------------------------------------------------------------------------
// Lesson Sessions
// ---------------------------------------------------------------------------

export async function getModeratorLessonSessions(): Promise<ModeratorSessionRow[]> {
  return unwrapData<ModeratorSessionRow[]>("/moderator/lesson-sessions");
}

export async function getModeratorSessionStudents(
  sessionId: number
): Promise<ModeratorSessionStudentRow[]> {
  return unwrapData<ModeratorSessionStudentRow[]>(
    `/moderator/lesson-sessions/${sessionId}/students`
  );
}

// ---------------------------------------------------------------------------
// Attendance — excused only
// ---------------------------------------------------------------------------

export async function markAttendanceExcused(
  sessionId: number,
  studentId: number
): Promise<void> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/moderator/lesson-sessions/${sessionId}/attendance`,
    {
      method: "PATCH",
      json: { student_id: studentId },
    }
  );
  if (!res.success) throw new Error(res.message || "Server error.");
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function getModeratorStudents(): Promise<ModeratorStudentRow[]> {
  return unwrapData<ModeratorStudentRow[]>("/moderator/students");
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function getModeratorTeachers(): Promise<ModeratorTeacherRow[]> {
  return unwrapData<ModeratorTeacherRow[]>("/moderator/teachers");
}

// ---------------------------------------------------------------------------
// Homework
// ---------------------------------------------------------------------------

export async function getModeratorHomework(): Promise<ModeratorHomeworkRow[]> {
  return unwrapData<ModeratorHomeworkRow[]>("/moderator/homework");
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export async function getModeratorQuizzes(): Promise<ModeratorQuizRow[]> {
  return unwrapData<ModeratorQuizRow[]>("/moderator/quizzes");
}
