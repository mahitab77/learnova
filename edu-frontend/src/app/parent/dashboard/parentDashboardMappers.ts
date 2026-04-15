import type {
  AnnouncementRow,
  ApiResult,
  ParentAssignmentRow,
  ParentRequestRow,
  ParentStudentRow,
  StudentSelectionRow,
} from "@/src/services/parentService";
import type {
  ParentAssignment,
  ParentRequest,
  ParentSelection,
  ParentStudent,
} from "./parentDashboardTypes";

export type ParentAnnouncement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
};

export type ParentNotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
};

export type ParentNotifications = {
  unreadCount: number;
  items: ParentNotificationItem[];
};

export function toHookError(message?: string, code?: string): string {
  if (
    code === "SESSION_REQUIRED" ||
    code === "AUTH_MISSING" ||
    code === "AUTH_USER_NOT_FOUND" ||
    code === "AUTH_USER_INACTIVE"
  ) {
    return "NOT_AUTHENTICATED";
  }
  return message || "Request failed.";
}

export function requireData<T>(
  result: ApiResult<T>
): { ok: true; data: T } | { ok: false; error: string } {
  if (!result.success || result.data == null) {
    return { ok: false, error: toHookError(result.message, result.code) };
  }
  return { ok: true, data: result.data };
}

export function mapStudentRow(row: ParentStudentRow): ParentStudent {
  return {
    linkId: row.link_id,
    studentId: row.student_id,
    studentName: row.student_name,
    systemId: row.system_id != null ? Number(row.system_id) : null,
    stageId: row.stage_id != null ? Number(row.stage_id) : null,
    gradeLevelId: row.grade_level_id != null ? Number(row.grade_level_id) : null,
    systemName: typeof row.system_name === "string" ? row.system_name : null,
    stageName: typeof row.stage_name === "string" ? row.stage_name : null,
    gradeLevelName:
      typeof row.grade_level_name === "string" ? row.grade_level_name : null,
    relationship: row.relationship ?? "",
    hasOwnLogin: row.has_own_login === true || Number(row.has_own_login) === 1,
    studentUserId:
      typeof row.student_user_id === "number" ? row.student_user_id : null,
  };
}

export function mapSelectionRow(row: StudentSelectionRow): ParentSelection {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectNameAr: row.subject_name_ar,
    subjectNameEn: row.subject_name_en,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    photoUrl: row.photo_url,
  };
}

export function mapAssignmentRow(row: ParentAssignmentRow): ParentAssignment {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    subjectNameAr: row.subject_name_ar,
    subjectNameEn: row.subject_name_en,
    type: row.type === "homework" || row.type === "quiz" ? row.type : "other",
    title: row.title,
    score: row.score,
    maxScore: row.max_score,
    submittedAt: row.submitted_at,
    dueAt: row.due_at,
  };
}

export function mapRequestRow(row: ParentRequestRow): ParentRequest {
  const currentTeacherName =
    typeof row.current_teacher_name === "string" ? row.current_teacher_name : null;
  const requestedTeacherName =
    typeof row.requested_teacher_name === "string"
      ? row.requested_teacher_name
      : null;

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    subjectId: row.subject_id,
    subjectNameAr: row.subject_name_ar,
    subjectNameEn: row.subject_name_en,
    teacherName: currentTeacherName,
    currentTeacherId: row.current_teacher_id,
    currentTeacherName,
    requestedTeacherId: row.requested_teacher_id ?? null,
    requestedTeacherName,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at ?? "",
  };
}

export function mapAnnouncementRow(row: AnnouncementRow): ParentAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    createdAt: row.createdAt,
  };
}
