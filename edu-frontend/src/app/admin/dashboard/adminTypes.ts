// src/app/admin/dashboard/adminTypes.ts
// ============================================================================
// Shared Admin Dashboard Types & Helpers
// ----------------------------------------------------------------------------
// Responsibilities:
//  - Define core types used across the admin dashboard (AdminUser, Subject,
//    Teacher, ParentRequest, Users, API response wrapper).
//  - Define Lang + TabKey unions.
//  - Provide shared helpers to normalize DB flags and format dates.
//  - Phase 3: Admin Lesson Sessions (read-only overview).
//  - NEW: Admin Notifications inbox types.
// ----------------------------------------------------------------------------
// NOTES / ALIGNMENT FIXES (IMPORTANT):
// 1) ✅ TabKey includes "notifications".
// 2) ✅ TeacherScheduleRow.weekday is documented as 1..7 (Mon..Sun) because your
//    backend normalization often stores/compares weekday as 1..7.
//    (If your DB truly stores 0..6, update only this comment + mapping in UI.)
// 3) ✅ Notifications API can return either:
//      - NotificationRow[] (simple list)
//      - NotificationInbox { unreadCount, items } (richer shape)
//    We support BOTH via NotificationApiResponse.
// 4) ✅ AdminLessonSessionRow.session_date is optional to avoid runtime undefined
//    if backend only returns scheduled_date.
// ============================================================================

export type Lang = "en" | "ar";

// ============================================================================
// Tabs in the admin dashboard
// ----------------------------------------------------------------------------
// NOTE:
//  - "sessions" is added for Phase 3 (Admin Lesson Sessions panel)
//  - "notifications" tab added for admin inbox UI
// ============================================================================
export type TabKey =
  | "overview"
  | "subjects"
  | "teachers"
  | "approvals"
  | "assignments"
  | "schedules"
  | "sessions" // ✅ Phase 3
  | "announcements"
  | "notifications" // ✅ NEW
  | "requests"
  | "users"
  | "moderators" // ✅ Moderator management
  | "settings";

// ============================================================================
// Core Admin User
// ============================================================================
export type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

// ============================================================================
// Subjects
// ============================================================================
export type SubjectAdminRow = {
  id: number;
  name_ar: string;
  name_en: string;
  is_active: 0 | 1 | boolean;
  sort_order: number | null;
};

// ============================================================================
// Teachers (includes onboarding / approval metadata)
// ============================================================================
export type TeacherAdminRow = {
  id: number;
  name: string;
  bio_short: string | null;
  gender: string | null;
  photo_url: string | null;
  is_active: 0 | 1 | boolean;
  subjects: string | null;

  // Optional – onboarding / approvals
  status?: "pending_review" | "approved" | "rejected" | string;
  max_capacity?: number | null;
  approval_notes?: string | null;
  created_at?: string;
};

// ============================================================================
// Parent Change Requests
// ============================================================================
export type ParentRequestRow = {
  id: number;
  status: "pending" | "approved" | "rejected" | string;
  reason_text: string | null;
  created_at: string | null;

  parent_id: number;
  parent_name: string;

  student_id: number;
  student_name: string;

  subject_name_en: string;
  subject_name_ar: string;

  current_teacher_id: number | null;
  current_teacher_name: string | null;
  request_type?: "parent" | "lesson";
};

// ============================================================================
// Users tab rows (Students & Parents)
// ============================================================================
export type StudentAdminRow = {
  student_id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  preferred_lang: string | null;
  is_active: 0 | 1 | boolean;
  created_at: string;
};

export type ParentAdminRow = {
  parent_id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  preferred_lang: string | null;
  is_active: 0 | 1 | boolean;
  created_at: string;
};

// ============================================================================
// Generic API response wrapper
// ============================================================================
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ============================================================================
// Helpers
// ============================================================================
export function safeBool(value: boolean | 0 | 1): boolean {
  if (value === 1) return true;
  if (value === 0) return false;
  return Boolean(value);
}

// ============================================================================
// Parent ↔ Student Links
// ============================================================================
export type ParentStudentLinkRow = {
  id: number;
  parent_id: number;
  student_id: number;
  relationship: "mother" | "father" | "guardian" | string;
  created_at: string;

  parent_user_id: number;
  parent_name: string;

  student_user_id: number;
  student_name: string;
};

// ============================================================================
// Teacher Assignments
// ============================================================================
export type TeacherAssignmentRow = {
  subject_id: number;
  subject_name_en: string;
  subject_name_ar: string;
  teacher_id: number;
  teacher_name: string;
  max_capacity: number | null;
  current_load: number;
};

// ============================================================================
// Teacher Schedules
// ============================================================================
export type TeacherScheduleRow = {
  id: number;
  teacher_id: number;
  teacher_name: string;

  // ✅ Backend-normalized weekday (commonly 1..7 where 1=Mon ... 7=Sun)
  // If your DB returns 0..6, you can keep value but update UI labels accordingly.
  weekday: number;

  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  is_group: 0 | 1 | boolean;
  max_students: number | null;
  created_at: string;
};

// ============================================================================
// Announcements
// ============================================================================
export type AnnouncementRow = {
  id: number;
  title: string;
  body: string;
  audience: "all" | "students" | "parents" | "teachers";
  created_by: number | null;
  created_at: string;
};

// ============================================================================
// Admin Overview / Analytics
// ============================================================================
export type AdminOverview = {
  activeStudents: number;
  activeParents: number;
  activeTeachers: number;
  subjects: number;
  pendingParentRequests: number;
  pendingTeacherApprovals: number;
  trendLast30Days: OverviewTrendPoint[];
};

// ============================================================================
// Admin Settings
// ============================================================================
export type AdminSettings = {
  gradeLevels: string[];
  termStartDate: string | null;
  termEndDate: string | null;
  defaultLanguage: string;
  autoEmailTeachersOnParentChange: boolean;
};

// ============================================================================
// Phase 3 — Admin Lesson Sessions (READ-ONLY)
// ----------------------------------------------------------------------------
// Mirrors getAdminLessonSessions controller SELECT.
// Admins can:
//  - View sessions
//  - Monitor status, attendance, linkage
//  - NO direct mutations (by design)
// ============================================================================
export type AdminLessonSessionRow = {
  id: number;

  // Relations
  student_id: number;
  student_name: string;

  // Some backends return only scheduled_date; keep this optional to be safe.
  session_date?: string;

  teacher_id: number;
  teacher_name: string;

  subject_id: number;
  subject_name_en: string;
  subject_name_ar: string;

  // Scheduling
  scheduled_date: string; // ISO date
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS

  // Status / lifecycle
  status: "scheduled" | "completed" | "cancelled" | "missed" | string;

  // Optional metadata
  is_group: 0 | 1 | boolean;
  attendance_marked: 0 | 1 | boolean;

  created_at: string;
};

// ============================================================================
// Shared Admin Utilities
// ============================================================================
export const adminTypeUtils = {
  safeBool,

  normalizeIsGroup: (value: 0 | 1 | boolean): boolean => safeBool(value),

  // ✅ Notification read flag helper
  normalizeIsRead: (value: 0 | 1 | boolean): boolean => safeBool(value),

  toDatabaseBool: (value: boolean): 0 | 1 => (value ? 1 : 0),

  formatDate: (iso: string | null, lang: Lang): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  },
};

export type OverviewTrendPoint = {
  date: string; // YYYY-MM-DD
  students: number;
  teachers: number;
};
// ============================================================================
// Notifications (Admin Inbox) — NEW
// ----------------------------------------------------------------------------
// Keep snake_case to match DB column names typically returned from MySQL SELECT.
// ============================================================================

export type NotificationRow = {
  id: number;

  user_id: number;

  type: string;
  title: string;
  body: string | null;

  related_type: string | null;
  related_id: number | null;

  is_read: 0 | 1 | boolean;
  read_at: string | null;

  // ✅ Some endpoints might omit/alias this. Keep tolerant.
  created_at: string | null;
};

export type NotificationInbox = {
  unreadCount: number;
  items: NotificationRow[];
};

/**
 * ✅ API shape tolerance:
 * Some backends return { items } without unreadCount.
 * We keep NotificationInbox strict for UI state,
 * but allow unreadCount to be optional in the raw API response type.
 */
export type NotificationInboxApi = {
  unreadCount?: number;
  items: NotificationRow[];
};

// ✅ Support BOTH possible backend return shapes:
// - list of rows
// - inbox object with items (+ optional unreadCount)
export type NotificationApiResponse = NotificationRow[] | NotificationInboxApi;

// ============================================================================
// Moderator Management
// ============================================================================
export type ModeratorAdminRow = {
  id: number;
  full_name: string;
  email: string;
  is_active: 0 | 1 | boolean;
  created_at: string;
};
