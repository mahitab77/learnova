// src/app/parent/dashboard/parentDashboardTypes.ts

/**
 * Shared types for Parent Dashboard
 * ---------------------------------
 * This file defines:
 *   - Raw API row shapes (snake_case) exactly as backend returns.
 *   - UI-facing shapes (camelCase) used by React components & hooks.
 *
 * NOTE:
 *   Never use `any` here. All fields are explicitly typed.
 */

/* ============================================================================
 * 1. Students list (/parent/students)
 * ========================================================================== */

/**
 * Raw row from GET /parent/students
 * (parent.controller.js → getMyStudents)
 *
 * SELECT
 *   ps.id           AS link_id,
 *   s.id            AS student_id,
 *   COALESCE(u.full_name, CONCAT('Student #', s.id)) AS student_name,
 *   s.system_id,
 *   s.stage_id,
 *   s.grade_level_id,
 *   es.name         AS system_name,
 *   gs.name_en      AS stage_name,
 *   gl.name_en      AS grade_level_name,
 *   ps.relationship,
 *   ps.has_own_login AS has_own_login,
 *   s.user_id       AS student_user_id
 */
export type ParentStudentRowApi = {
  link_id: number;
  student_id: number;
  student_name: string;
  system_id: number | null;
  stage_id: number | null;
  grade_level_id: number | null;
  system_name: string | null;
  stage_name: string | null;
  grade_level_name: string | null;
  relationship: string;
  has_own_login: number | boolean | null;
  student_user_id: number | null;
};

/**
 * Normalized student row used across the Parent Dashboard.
 *
 * hasOwnLogin:
 *   - true  -> direct login enabled via parent_students.has_own_login.
 *   - false -> direct login disabled via parent_students.has_own_login.
 *
 * studentUserId:
 *   - Linked child identity used when the parent switches into student mode.
 *   - Not a direct-login capability signal.
 */
export type ParentStudent = {
  linkId: number;
  studentId: number;
  studentName: string;
  systemId: number | null;
  stageId: number | null;
  gradeLevelId: number | null;
  systemName: string | null;
  stageName: string | null;
  gradeLevelName: string | null;
  relationship: string;
  hasOwnLogin: boolean;
  studentUserId: number | null;
};

/* ============================================================================
 * 2. Subject selections for a student
 *    (/parent/student/:studentId/selections)
 * ========================================================================== */

/**
 * Raw row from GET /parent/student/:studentId/selections
 *
 * SELECT
 *   COALESCE(sts.id, ss.id) AS id,
 *   ss.subject_id,
 *   subj.name_ar            AS subject_name_ar,
 *   subj.name_en            AS subject_name_en,
 *   sts.teacher_id          AS teacher_id,
 *   COALESCE(t.name, '')    AS teacher_name,
 *   NULL                    AS photo_url
 */
export type ParentSelectionRowApi = {
  id: number;
  subject_id: number;
  subject_name_ar: string;
  subject_name_en: string;
  teacher_id: number | null;
  teacher_name: string | null;
  photo_url: string | null;
};

export type ParentSelection = {
  id: number;
  subjectId: number;
  subjectNameAr: string;
  subjectNameEn: string;
  teacherId: number | null;
  teacherName: string | null;
  photoUrl: string | null;
};

/* ============================================================================
 * 3. Parent requests (/parent/requests)
 * ========================================================================== */

/**
 * Raw row from GET /parent/requests
 *
 * SELECT
 *   r.id,
 *   r.student_id,
 *   COALESCE(su.full_name, CONCAT('Student #', s.id)) AS student_name,
 *   subj.name_ar AS subject_name_ar,
 *   subj.name_en AS subject_name_en,
 *   t.name       AS teacher_name,
 *   r.status,
 *   r.reason_text AS reason,
 *   r.created_at
 */
export type ParentRequestRowApi = {
  id: number;
  student_id: number;
  student_name: string;
  subject_name_ar: string | null;
  subject_name_en: string | null;
  teacher_name: string | null;
  status: string;
  reason: string | null;
  created_at: string; // ISO datetime
};

export type ParentRequestStatus = "pending" | "approved" | "rejected" | string;

export type ParentRequest = {
  id: number;
  studentId: number;
  studentName: string;
  subjectId?: number | null;
  subjectNameAr: string | null;
  subjectNameEn: string | null;
  teacherName: string | null;
  currentTeacherId?: number | null;
  currentTeacherName?: string | null;
  requestedTeacherId?: number | null;
  requestedTeacherName?: string | null;
  status: ParentRequestStatus;
  reason: string | null;
  createdAt: string;
};

/* ============================================================================
 * 4. Assignments & quizzes (/parent/assignments)
 * ========================================================================== */

/**
 * Raw row from GET /parent/assignments
 * (merged homework_submissions + quiz_submissions)
 *
 *   id,
 *   student_id,
 *   student_name,
 *   subject_name_ar,
 *   subject_name_en,
 *   'homework' | 'quiz' AS type,
 *   title,
 *   score,
 *   max_score,
 *   submitted_at,
 *   due_at
 */
export type ParentAssignmentType = "homework" | "quiz" | "other";

export type ParentAssignmentRowApi = {
  id: number;
  student_id: number;
  student_name: string;
  subject_name_ar: string | null;
  subject_name_en: string | null;
  type: string; // we normalize below
  title: string;
  score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  due_at: string | null;
};

export type ParentAssignment = {
  id: number;
  studentId: number;
  studentName: string;
  subjectNameAr: string | null;
  subjectNameEn: string | null;
  type: ParentAssignmentType;
  title: string;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
  dueAt: string | null;
};

/* ============================================================================
 * 5. Teacher options for "choose teacher" flows
 *    (/parent/teacher-options)
 * ========================================================================== */

/**
 * Raw row from GET /parent/teacher-options
 *
 * SELECT
 *   teacher_id,
 *   teacher_full_name,
 *   bio,
 *   photo_url,
 *   demo_video_url,
 *   years_experience,
 *   rating,
 *   rating_count
 */
export type ParentTeacherOptionRowApi = {
  teacher_id: number;
  teacher_full_name: string;
  bio: string | null;
  photo_url: string | null;
  demo_video_url: string | null;
  years_experience: string | number | null;
  rating: number | null;
  rating_count: number | null;
};

export type ParentTeacherOption = {
  teacherId: number;
  fullName: string;
  bio: string | null;
  photoUrl: string | null;
  demoVideoUrl: string | null;
  yearsExperience: string | number | null;
  rating: number | null;
  ratingCount: number | null;
};

