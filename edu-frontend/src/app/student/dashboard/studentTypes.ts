// src/app/student/dashboard/studentTypes.ts
// =============================================================================
// STUDENT DASHBOARD TYPES - Single Source of Truth
// =============================================================================
// This file contains all type definitions for the Student Dashboard.
// Organized by category with clear documentation for each type.
// =============================================================================

// =============================================================================
// 1. CORE APPLICATION TYPES
// =============================================================================

/**
 * Language options for the application
 */
export type Lang = "en" | "ar";

/**
 * Generic API response wrapper used by all endpoints
 * @template T - The type of the data payload
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

/**
 * Loading state for async operations
 */
export type LoadState = {
  loading: boolean;
  error: string | null;
};

/**
 * Active navigation tabs in the student dashboard
 */
export type ActiveTab =
  | "overview"
  | "subjects"
  | "schedule"
  | "homework"
  | "quizzes"
  | "attendance"
  | "grades"
  | "announcements"
  | "notifications"
  | "profile";

// =============================================================================
// 2. USER & PROFILE TYPES
// =============================================================================

/**
 * Basic user information
 */
export type DashboardUser = {
  id: number;
  fullName: string;
  email?: string;
  preferredLang: string | null;
};

/**
 * Student-specific profile information
 */
export type DashboardStudent = {
  id: number;
  systemId: number | null;
  stageId: number | null;
  gradeLevelId: number | null;
  gradeStage: string | null;
  gradeNumber: number | null;
  gender: "male" | "female" | null;
  onboardingCompleted: boolean;
};

/**
 * Parent/guardian information linked to student
 */
export type StudentProfileParent = {
  parentId: number;
  fullName: string;
  relationship: "mother" | "father" | "guardian";
};

/**
 * Complete student profile data
 */
export type StudentProfileData = {
  user: DashboardUser;
  student: DashboardStudent;
  parents: StudentProfileParent[];
};

// =============================================================================
// 3. SUBJECT & TEACHER TYPES
// =============================================================================

/**
 * Subject information with associated teacher
 */
export type DashboardSubject = {
  subjectId: number;
  nameEn: string | null;
  nameAr: string | null;
  teacher: {
    id: number;
    name: string;
    photoUrl: string | null;
    primaryVideoUrl: string | null;
  };
  selectionStatus: string;
  selectedBy: string;
  selectedAt: string | null;
};

// =============================================================================
// 4. SCHEDULE & LESSON TYPES
// =============================================================================

/**
 * A scheduled lesson/session
 */
export type DashboardLesson = {
  sessionId: number;
  startsAt: string;
  endsAt: string;
  subjectId: number;
  subjectNameEn: string | null;
  subjectNameAr: string | null;
  teacherId: number;
  teacherName: string;
  teacherPhotoUrl: string | null;
  attendanceStatus: string;
};
// =============================================================================
// 4.1 SESSION RATING TYPES
// =============================================================================

export type TeacherSessionRating = {
  stars: number;
  comment: string | null;
};

export type SessionRatingData = {
  canRate: boolean;
  editableUntil: string | null;
  rating: TeacherSessionRating | null;
};

export type SaveSessionRatingData = {
  rating: TeacherSessionRating;
  summary: {
    ratingAvg: number | null;
    ratingCount: number;
  };
};
// =============================================================================
// 5. ASSESSMENT TYPES
// =============================================================================

/**
 * Homework assignment item (list view)
 */
export type HomeworkItem = {
  id: number;
  title: string;
  subjectId: number;
  subjectNameEn: string | null;
  subjectNameAr: string | null;
  dueAt: string | null;
  maxScore: number | null;
  status: string;
  score: number | null;
};

/**
 * Homework assignment with full details
 */
export type HomeworkDetail = HomeworkItem & {
  description?: string | null;
  attachments?: { id: number; fileUrl: string; fileName: string }[];
};

/**
 * Quiz/Test item (list view)
 */
export type QuizItem = {
  id: number;
  title: string;
  subjectId: number;
  subjectNameEn: string | null;
  subjectNameAr: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  maxScore: number | null;
  status: string;
  score: number | null;
};

/**
 * Quiz/Test with full details
 */
export type QuizDetail = QuizItem & {
  description?: string | null;
  questions?: { id: number; text: string }[];
};

/**
 * Graded assignment or quiz
 */
export type GradeItem = {
  assignmentId?: number;
  quizId?: number;
  title: string;
  subjectNameEn: string | null;
  subjectNameAr: string | null;
  score: number | null;
  maxScore: number | null;
  gradedAt: string | null;
};

// =============================================================================
// 6. ATTENDANCE TYPES
// =============================================================================

/**
 * Attendance summary statistics
 */
export type AttendanceSummary = {
  period: string;
  presentCount: number;
  totalSessions: number;
  percentage: number;
};

/**
 * Complete attendance data
 */
export type AttendanceData = {
  summary: AttendanceSummary | null;
  lessons: DashboardLesson[];
};

// =============================================================================
// 7. COMMUNICATION TYPES
// =============================================================================

/**
 * Announcement from school/teacher
 */
export type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
};

/**
 * Individual notification item
 */
export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
};

/**
 * Complete notifications data with unread count
 */
export type NotificationsData = {
  unreadCount: number;
  items: NotificationItem[];
};

// =============================================================================
// 8. GRADES DATA TYPE
// =============================================================================

/**
 * Combined grades data for homework and quizzes
 */
export type GradesData = {
  homework: GradeItem[];
  quizzes: GradeItem[];
};

// =============================================================================
// 9. TEACHER AVAILABILITY & BOOKING TYPES
// =============================================================================

/**
 * Query parameters for fetching teacher availability
 */
export type TeacherAvailabilityQuery = {
  teacherId: number;
  subjectId: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

/**
 * Weekly recurring availability slot
 */
export type WeeklySlot = {
  id: number;
  weekday: number; // canonical backend weekday: 1..7 (Mon..Sun)
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  is_group: number; // 0 or 1
  max_students: number;
  is_active: number; // 0 or 1
  schedule_id?: number; // Stable backend schedule identity; optional for older cached responses
};

/**
 * Which subjects are allowed for which schedule slots
 */
export type SlotScope = {
  schedule_id: number;
  subject_id: number;
  is_active: number;
};

/**
 * One-time exception to regular availability (unavailable/extra_available)
 */
export type TeacherAvailabilityException = {
  exception_date: string; // "YYYY-MM-DD"
  start_time: string;
  end_time: string;
  exception_type: "unavailable" | "extra_available";
  is_active?: number;
};

/**
 * Complete teacher availability response
 */
export type AvailabilityResponse = {
  teacherId: number;
  subjectId: number;
  scope: { systemId: number; stageId: number; gradeLevelId: number | null };
  slots: WeeklySlot[];
  slotScopes: SlotScope[];
  exceptions: TeacherAvailabilityException[];
  sessions: Array<{
    starts_at: string; // "YYYY-MM-DD HH:MM:SS"
    ends_at: string;
    status: string;
  }>;
};

/**
 * A bookable time slot generated from availability data
 */
export type BookableSlot = {
  scheduleId: number;
  subjectId: number;
  date: string; // YYYY-MM-DD
  startsAt: string; // "YYYY-MM-DD HH:MM:SS"
  endsAt: string; // "YYYY-MM-DD HH:MM:SS"
  isGroup: boolean;
  maxStudents: number;
};

/**
 * Lesson request pending approval
 * Matches backend response from getMyPendingLessonRequests
 */
export type PendingLessonRequest = {
  id: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | "scheduled";
  
  // Core timing information
  startsAt: string | null; // SQL datetime or ISO string
  endsAt: string | null;
  cancelReason: string | null;
  
  // UI-friendly derived fields (added by backend)
  date: string | null; // "YYYY-MM-DD"
  timeWindow: string | null; // "HH:MM:SS-HH:MM:SS"
  teacherName: string | null;
  subjectNameEn: string | null;
  subjectNameAr: string | null;
  
  // Related entities for rich UI display
  student: { id: number; name: string | null } | null;
  subject: { id: number; nameEn: string | null; nameAr: string | null };
  teacher: { id: number; name: string | null; photoUrl: string | null };
};

// =============================================================================
// 10. DASHBOARD DATA TYPES
// =============================================================================

/**
 * Complete dashboard data for the overview tab
 */
export type StudentDashboardData = {
  user: DashboardUser;
  student: DashboardStudent;

  subjects: DashboardSubject[];
  upcomingLessons: DashboardLesson[];
  attendanceSummary: AttendanceSummary | null;

  pendingHomework: HomeworkItem[];
  pendingQuizzes: QuizItem[];

  recentGrades: {
    homework: GradeItem[];
    quizzes: GradeItem[];
  };

  announcements: Announcement[];
  notifications: NotificationsData;
};

/**
 * Lighter version for initial overview load
 */
export type StudentOverviewData = {
  user: DashboardUser;
  student: DashboardStudent;

  subjects?: DashboardSubject[];
  upcomingLessons?: DashboardLesson[];
  attendanceSummary?: AttendanceSummary | null;

  pendingHomework?: HomeworkItem[];
  pendingQuizzes?: QuizItem[];

  announcements?: Announcement[];
  notifications?: NotificationsData;
};

// =============================================================================
// 11. LOCALIZATION TYPES
// =============================================================================

/**
 * Complete translation object for the student dashboard
 */
export type StudentLangTexts = {
  // Page headers
  title: string;
  welcomePrefix: string;
  subtitle: string;
  gradeLabel: string;
  
  // Status messages
  loading: string;
  error: string;
  notLoggedIn: string;

  // Navigation tabs
  tabs: Record<ActiveTab, string>;

  // Statistics labels
  stats: {
    subjects: string;
    attendance: string;
    todos: string;
    todosSuffix: string;
  };

  // Section headers
  sections: {
    upcomingLessons: string;
    noLessons: string;
    subjects: string;
    homeworkQuizzes: string;
    homework: string;
    noHomework: string;
    quizzes: string;
    noQuizzes: string;
    recentGrades: string;
    attendanceSummary: string;
    attendanceLessons: string;
    announcements: string;
    noAnnouncements: string;
    notifications: string;
    noNotifications: string;
    unreadBadge: string;
    profileInfo: string;
    lessonRequests: string;
    myLessonRequests: string;
    pendingRequests: string;
    noPendingRequests: string;
    teacherAvailability: string;
    noAvailability: string;
    noLessonsAction: string;
    bookingRaceHint: string;
  };

  // Form and UI labels
  labels: {
    due: string;
    at: string;
    time: string;
    teacher: string;
    subject: string;
    status: string;
    day: string;
    spots: string;
    available: string;
    requested: string;
    full: string;
    pending: string;
  };

  // Action button texts
   actions: {
    manageSelections: string;
    goToSelections: string;
    viewDetails: string;
    close: string;
    markAllRead: string;
    markRead: string;
    requestLesson: string;
    cancelRequest: string;
    requestLessonTitle: string;
    rateTeacher: string;
  };
    rating: {
    title: string;
    yourRating: string;
    optionalComment: string;
    placeholder: string;
    save: string;
    update: string;
    rated: string;
    availableWindow: string;
    notEligible: string;
  };

  // Weekday names (localized)
  weekdays: Record<string, string>;
};

// =============================================================================
// 12. COMPONENT PROP TYPES
// =============================================================================

/**
 * Props for the SchedulePanel component
 */
export interface SchedulePanelProps {
  lang: Lang;
  t: StudentLangTexts;
  schedule: DashboardLesson[] | null;
  state: LoadState;
  onRefresh: () => void;
}

// =============================================================================
// 13. API RESPONSE TYPES (For specific endpoints)
// =============================================================================

/**
 * Backend response shape for profile endpoint
 */
export type StudentProfileApiResponse = {
  user: DashboardUser;
  student: DashboardStudent;
  parents?: StudentProfileParent[] | null;
};

/**
 * Backend response shape for notifications endpoint
 */
export type DashboardNotifications = {
  unreadCount: number;
  items: NotificationItem[];
};
