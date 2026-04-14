// src/app/teacher/dashboard/teacherDashboardTypes.ts
/**
 * =============================================================================
 * Teacher Dashboard — Shared Types (SCHEMA-ALIGNED + UI PACK TYPES)
 * -----------------------------------------------------------------------------
 * Goals:
 * ✅ Core dashboard rows follow your teacher endpoints (mostly snake_case)
 * ✅ Messages endpoints are camelCase (createdAt / isRead / relatedType...)
 * ✅ No `any`
 * ✅ Includes TeacherDashboardLanguagePack type (matches teacherDashboardTexts.ts)
 *
 * IMPORTANT:
 * - If your backend returns different casing for ANY endpoint, do NOT "guess".
 *   Update ONLY the specific type(s) below to reflect the real response.
 * =============================================================================
 */

export type Lang = "en" | "ar";

/** Tabs used by the Teacher Dashboard page */
export type TeacherDashboardTabId =
  | "overview"
  | "sessions"
  | "students"
  | "homework"
  | "quizzes"
  | "schedule"
  | "exceptions"
  | "messages"
  | "lessonRequests"
  | "profile";

export type TeacherTabId = TeacherDashboardTabId;
export type TeacherTabKey = TeacherDashboardTabId;

// -----------------------------------------------------------------------------
// Backend schema rows (core dashboard)
// NOTE: These match your teacher core endpoints that return snake_case.
// -----------------------------------------------------------------------------

export type TeacherProfile = {
  id: number;
  user_id: number;
  status: string;
  is_active: number;

  name?: string | null;
  bio_short?: string | null;
  photo_url?: string | null;
  phone?: string | null;

  user_full_name?: string | null;
  user_email?: string | null;
  user_preferred_lang?: string | null;
};

export type TeacherStudentRow = {
  id: number;
  student_id: number;
  subject_id: number;
  teacher_id: number;
  selected_by: string;
  status: string;
  selected_at: string;

  student_name: string;
  student_email: string;
  subject_name_en: string;
  subject_name_ar: string;
};

export type LessonSessionRow = {
  id: number;
  teacher_id: number;
  subject_id: number;

  starts_at: string;
  ends_at: string;

  status:
    | "pending"
    | "rejected"
    | "scheduled"
    | "completed"
    | "cancelled"
    | "no_show"
    | "approved"
    | (string & {});

  subject_name_en: string;
  subject_name_ar: string;
  students_count: number;
};

export type LessonSessionDetails = {
  session: LessonSessionRow;
  students: Array<{
    student_id: number;
    student_name: string;
    student_email: string;
    attendance_status:
      | "scheduled"
      | "present"
      | "absent"
      | "late"
      | "excused"
      | (string & {});
  }>;
};

export type HomeworkRow = {
  id: number;
  teacher_id: number;
  subject_id: number;
  title: string;
  description: string | null;
  due_at: string;
  max_score: number | null;
  attachments_url: string | null;
  is_active: number;

  subject_name_en: string;
  subject_name_ar: string;
};

export type HomeworkSubmissionRow = {
  id: number;
  homework_id: number;
  student_id: number;

  submission_url: string | null;
  submitted_at: string | null; // ✅ never undefined
  status: string;

  score: number | null;
  feedback: string | null;

  student_name: string;
  student_email: string;
};

export type QuizRow = {
  id: number;
  teacher_id: number;
  subject_id: number;
  title: string;
  description: string | null;

  /**
   * IMPORTANT:
   * Quizzes use availability windows in your refactor.
   */
  available_from: string;
  available_until: string;
  due_at: string;  // Added missing property
  time_limit_min: number | null;

  max_score: number | null;
  quiz_url: string | null;
  is_active: number;

  subject_name_en: string;
  subject_name_ar: string;
};

export type QuizSubmissionRow = {
  id: number;
  quiz_id: number;
  student_id: number;

  submission_url: string | null;
  submitted_at: string | null; // ✅ never undefined
  status: string;

  score: number | null;
  feedback: string | null; // ✅ keep stable (avoid optional undefined)

  student_name: string;
  student_email: string;
};

export type ScheduleSlotRow = {
  id: number;
  teacher_id: number;

  weekday: number; // canonical backend weekday: 1..7 (Mon..Sun)
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS

  is_group: number; // 0/1
  max_students: number | null;

  is_active: number; // 0/1
};

export type SlotOfferingRow = {
  subject_id: number;
  system_id: number;
  stage_id: number;
  grade_level_id: number | null;
  is_active: number;
};

export type SlotOfferingsResponseRow = {
  teacher_id: number;
  schedule_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  schedule_is_active: number;
  is_group: number;
  max_students: number | null;
  offering_id: number;
  subject_id: number;
  system_id: number;
  stage_id: number;
  grade_level_id: number | null;
  offering_is_active: number;
};

export type GradeCatalogSystem = {
  id: number;
  name: string;
  code: string;
};

export type GradeCatalogStage = {
  id: number;
  systemId: number;
  nameEn: string;
  nameAr?: string | null;
  code: string;
};

export type GradeCatalogLevel = {
  id: number;
  stageId: number;
  nameEn: string;
  nameAr?: string | null;
  code: string;
};

export type ScheduleOfferingsMap = Record<number, SlotOfferingRow[]>;

export type SlotStatusKind = "draft" | "live";

export type ScheduleExceptionRow = {
  id: number;
  teacher_id: number;

  exception_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS

  /**
   * IMPORTANT:
   * Your dashboard state currently uses:
   *  "unavailable" | "extra_available"
   * Keep it canonical here to avoid type drift.
   */
  exception_type: "unavailable" | "extra_available" | (string & {});

  is_group: number; // 0/1
  max_students: number | null;

  note: string | null;
  reason: string | null;

  is_active: number; // 0/1
};

export type TeacherVideoRow = {
  id: number;
  teacher_id: number;
  subject_id: number;

  video_url: string;
  is_primary: number; // 0/1

  subject_name_en: string | null;
  subject_name_ar: string | null;
};

// -----------------------------------------------------------------------------
// Lesson Requests Types (snake_case, matches listMyPendingLessonRequests query)
// -----------------------------------------------------------------------------

export type PendingLessonRequestRow = {
  id: number;
  teacher_id: number;
  subject_id: number;
  schedule_id: number | null;
  starts_at: string;
  ends_at: string;
  status: "pending";
  created_by_user_id: number;
  student_id: number | null;
  student_name: string;
  student_email: string | null;
  requester_name: string | null;
  requester_email: string | null;
  subject_name_en: string;
  subject_name_ar: string;
};

// -----------------------------------------------------------------------------
// Messages Tab Types (teacher endpoints return camelCase)
// -----------------------------------------------------------------------------

export type TeacherAnnouncementRow = {
  id: number;
  title: string;
  body: string;
  audience: "all" | "students" | "parents" | "teachers";
  createdAt: string | null;
};

export type TeacherNotificationRow = {
  id: number;

  type: string;
  title: string;
  body: string | null;

  relatedType: string | null;
  relatedId: number | null;

  isRead: boolean;
  readAt: string | null;

  createdAt: string | null;
};

export type TeacherNotificationInbox = {
  unreadCount: number;
  items: TeacherNotificationRow[];
};

/**
 * Some backends return notifications as either:
 * - a raw array of notifications
 * - an inbox object { unreadCount, items }
 * Keep this union because your hook supports both shapes.
 */
export type TeacherNotificationApiResponse =
  | TeacherNotificationRow[]
  | TeacherNotificationInbox;

/** Exact API envelope used by your teacher endpoints (when wrapped). */
export type TeacherApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

// -----------------------------------------------------------------------------
// UI-only helper types
// -----------------------------------------------------------------------------

export type GradeTarget =
  | {
      kind: "homework";
      submissionId: number;
      currentScore: number | null;
      currentFeedback: string | null;
    }
  | {
      kind: "quiz";
      submissionId: number;
      currentScore: number | null;
      currentFeedback: string | null;
    }
  | null;

export type OverviewStats = {
  approvedStudents: number;
  upcoming: number;
  activeHw: number;
  activeQz: number;
  activeSlots: number;
  activeExceptions: number;

  // Optional (if you display them on overview)
  unreadNotifications?: number;
  newAnnouncements?: number;
};

// -----------------------------------------------------------------------------
// Text pack typing (matches teacherDashboardTexts.ts)
// IMPORTANT: Keep this aligned with the actual object keys you export.
// -----------------------------------------------------------------------------

export type TeacherDashboardLanguagePack = {
  direction: "ltr" | "rtl";

  pageTitle: string;

  header: {
    subtitle: string;
    loadingProfile: string;
    refresh: string;
    close: string;
    loading: string;
    failedToLoadDashboard: string;
  };

  status: string;

  tabs: {
    overview: string;
    sessions: string;
    students: string;
    homework: string;
    quizzes: string;
    schedule: string;
    exceptions: string;
    messages: string;
    profile: string;
  };

  common: {
    loading: string;
    empty: string;
    search: string;
    refresh: string;
    exportCsv: string;
    createNew: string;
    save: string;
    cancel: string;
    close: string;
    delete: string;
    edit: string;
    view: string;
    download: string;
    submit: string;
  };

  placeholders: {
    searchStudents: string;
    searchSessions: string;
    searchHomework: string;
    searchQuizzes: string;
  };

  statusLabels: {
    active: string;
    inactive: string;
    approved: string;
    pending: string;
    rejected: string;
    scheduled: string;
    completed: string;
    cancelled: string;
    noShow: string;
    attendance: {
      scheduled: string;
      present: string;
      absent: string;
      late: string;
      excused: string;
    };
    ungraded: string;
    graded: string;
  };

  overview: {
    title: string;
    subtitle: string;
    cards: {
      approvedStudents: { title: string; subtitle: string };
      upcomingSessions: { title: string; subtitle: string };
      activeHomework: { title: string; subtitle: string };
      activeQuizzes: { title: string; subtitle: string };
      activeSlots: { title: string; subtitle: string };
      activeExceptions: { title: string; subtitle: string };
      unreadNotifications: { title: string; subtitle: string };
      announcements: { title: string; subtitle: string };
    };
    todaySessions: {
      title: string;
      empty: string;
      table: {
        subject: string;
        time: string;
        status: string;
        students: string;
        actions: string;
        viewDetails: string;
      };
    };
  };

  sessions: {
    title: string;
    subtitle: string;
    empty: string;
    table: {
      subject: string;
      start: string;
      end: string;
      status: string;
      students: string;
      actions: string;
      viewDetails: string;
    };
  };

  students: {
    title: string;
    subtitle: string;
    empty: string;
    table: {
      student: string;
      email: string;
      subject: string;
      status: string;
      selectedAt: string;
    };
  };

  homework: {
    title: string;
    subtitle: string;
    empty: string;
    newButton: string;
    table: {
      title: string;
      subject: string;
      dueAt: string;
      active: string;
      actions: string;
      submissions: string;
      edit: string;
    };
  };

  quizzes: {
    title: string;
    subtitle: string;
    empty: string;
    newButton: string;
    table: {
      title: string;
      subject: string;
      availableFrom: string;
      availableUntil: string;
      active: string;
      actions: string;
      submissions: string;
      edit: string;
    };
  };

  schedule: {
    title: string;
    subtitle: string;
    empty: string;
    form: {
      weekday: string;
      start: string;
      end: string;
      mode: string;
      group: string;
      maxStudents: string;
      active: string;
      add: string;
    };
    table: {
      weekday: string;
      start: string;
      end: string;
      mode: string;
      maxStudents: string;
      active: string;
      actions: string;
    };
  };

  exceptions: {
    title: string;
    subtitle: string;
    empty: string;
    form: {
      date: string;
      start: string;
      end: string;
      type: string;
      unavailable: string;
      extraAvailable: string;
      group: string;
      maxStudents: string;
      note: string;
      reason: string;
      active: string;
      add: string;
    };
    table: {
      date: string;
      start: string;
      end: string;
      type: string;
      group: string;
      maxStudents: string;
      active: string;
      actions: string;
    };
  };

  profile: {
    title: string;
    subtitle: string;
    save: string;
    fields: {
      name: string;
      phone: string;
      bioShort: string;
      photoUrl: string;
    };
    videos: {
      title: string;
      subtitle: string;
      subjectId: string;
      videoUrl: string;
      makePrimary: string;
      addVideo: string;
      empty: string;
      setPrimary: string;
      delete: string;
    };
  };

  messages: {
    title: string;
    subtitle: string;

    tabAnnouncements: string;
    tabNotifications: string;

    announcementsEmpty: string;
    notificationsEmpty: string;

    markRead: string;
    markAllRead: string;

    typeLabel: string;
    relatedLabel: string;
  };

  modals: {
    sessionDetails: {
      title: string;
      loading: string;
      table: { student: string; email: string; attendance: string };
      update: string;
      close: string;
    };
    homework: {
      createTitle: string;
      editTitle: string;
      fields: {
        subjectId: string;
        title: string;
        description: string;
        dueAt: string;
        maxScore: string;
        attachmentsUrl: string;
        active: string;
      };
      save: string;
      cancel: string;
    };
    quiz: {
      createTitle: string;
      editTitle: string;
      fields: {
        subjectId: string;
        title: string;
        description: string;
        availableFrom: string;
        availableUntil: string;
        timeLimit: string;
        maxScore: string;
        active: string;
      };
      save: string;
      cancel: string;
    };
    submissions: {
      title: string;
      loading: string;
      empty: string;
      table: {
        student: string;
        email: string;
        status: string;
        score: string;
        actions: string;
        grade: string;
      };
      close: string;
    };
    grading: {
      title: string;
      score: string;
      feedback: string;
      save: string;
      cancel: string;
    };
  };
};

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

export function safeBool(value: boolean | 0 | 1): boolean {
  if (value === 1) return true;
  if (value === 0) return false;
  return Boolean(value);
}

export const teacherTypeUtils = {
  safeBool,

  normalizeIsRead: (value: boolean | 0 | 1): boolean => safeBool(value),

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
