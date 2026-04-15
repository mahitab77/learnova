import { apiFetch } from "@/src/lib/api";
import type { ApiError, JsonValue } from "@/src/lib/api";
import type {
  Announcement,
  AttendanceData,
  AvailabilityResponse,
  DashboardLesson,
  DashboardSubject,
  GradesData,
  HomeworkDetail,
  HomeworkItem,
  NotificationsData,
  PendingLessonRequest,
  QuizDetail,
  QuizItem,
  SaveSessionRatingData,
  SessionRatingData,
  StudentDashboardData,
} from "@/src/app/student/dashboard/studentTypes";

type ApiEnvelope<T> = { success: true; data: T; message?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number" &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  );
}

async function callStudentApi<T>(
  path: string,
  options: {
    signal?: AbortSignal;
    method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
    json?: JsonValue;
  } = {},
): Promise<T> {
  try {
    const raw = await apiFetch<unknown>(path, {
      method: options.method ?? "GET",
      signal: options.signal,
      ...(options.json !== undefined ? { json: options.json } : {}),
    });

    if (!isRecord(raw) || raw.success !== true || !("data" in raw)) {
      throw new Error("Invalid API response shape.");
    }

    return (raw as ApiEnvelope<T>).data;
  } catch (err) {
    if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      throw new Error("NOT_AUTHENTICATED");
    }
    if (isApiError(err)) {
      throw new Error(err.message);
    }
    throw err instanceof Error ? err : new Error("Request failed.");
  }
}

export const studentService = {
  getTeacherAvailability(params: {
    teacherId: number;
    subjectId: number;
    from?: string;
    to?: string;
    signal?: AbortSignal;
  }) {
    const qs = new URLSearchParams();
    qs.set("teacherId", String(params.teacherId));
    qs.set("subjectId", String(params.subjectId));
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    return callStudentApi<AvailabilityResponse>(
      `/student/teacher-availability?${qs.toString()}`,
      { signal: params.signal },
    );
  },

  getDashboard(signal?: AbortSignal) {
    return callStudentApi<StudentDashboardData>("/student/dashboard", { signal });
  },

  getSubjects(signal?: AbortSignal) {
    return callStudentApi<DashboardSubject[]>("/student/subjects", { signal });
  },

  getSchedule(signal?: AbortSignal) {
    return callStudentApi<DashboardLesson[]>("/student/schedule", { signal });
  },

  getPendingLessonRequests(signal?: AbortSignal) {
    return callStudentApi<PendingLessonRequest[]>("/student/lessons/requests/pending", { signal });
  },

  requestLesson(
    payload: {
      teacherId: number;
      subjectId: number;
      scheduleId: number;
      startsAt: string;
      endsAt: string;
    },
    signal?: AbortSignal,
  ) {
    return callStudentApi<unknown>("/student/lessons/request", {
      method: "POST",
      json: payload,
      signal,
    });
  },

  cancelScheduledSession(id: number, signal?: AbortSignal) {
    return callStudentApi<unknown>(`/student/lessons/sessions/${id}/cancel`, {
      method: "POST",
      json: {},
      signal,
    });
  },

  getAttendance(signal?: AbortSignal) {
    return callStudentApi<AttendanceData>("/student/attendance", { signal });
  },

  getHomework(signal?: AbortSignal) {
    return callStudentApi<HomeworkItem[]>("/student/homework", { signal });
  },

  getHomeworkById(id: number, signal?: AbortSignal) {
    return callStudentApi<HomeworkDetail>(`/student/homework/${id}`, { signal });
  },

  getQuizzes(signal?: AbortSignal) {
    return callStudentApi<QuizItem[]>("/student/quizzes", { signal });
  },

  getQuizById(id: number, signal?: AbortSignal) {
    return callStudentApi<QuizDetail>(`/student/quizzes/${id}`, { signal });
  },

  getGrades(signal?: AbortSignal) {
    return callStudentApi<GradesData>("/student/grades", { signal });
  },

  getAnnouncements(signal?: AbortSignal) {
    return callStudentApi<Announcement[]>("/student/announcements", { signal });
  },

  getNotifications(signal?: AbortSignal) {
    return callStudentApi<NotificationsData>("/student/notifications", { signal });
  },

  getProfile(signal?: AbortSignal) {
    return callStudentApi<unknown>("/student/profile", { signal });
  },

  cancelLessonRequest(id: number, signal?: AbortSignal) {
    return callStudentApi<unknown>(`/student/lessons/requests/${id}/cancel`, {
      method: "POST",
      json: {},
      signal,
    });
  },

  getSessionRating(sessionId: number, signal?: AbortSignal) {
    return callStudentApi<SessionRatingData>(`/student/lesson-sessions/${sessionId}/rating`, {
      signal,
    });
  },

  saveSessionRating(
    sessionId: number,
    payload: { stars: number; comment: string | null },
    signal?: AbortSignal,
  ) {
    return callStudentApi<SaveSessionRatingData>(`/student/lesson-sessions/${sessionId}/rating`, {
      method: "POST",
      json: payload,
      signal,
    });
  },

  markNotificationRead(id: number, signal?: AbortSignal) {
    return callStudentApi<unknown>(`/student/notifications/${id}/read`, {
      method: "PATCH",
      json: {},
      signal,
    });
  },

  markAllNotificationsRead(signal?: AbortSignal) {
    return callStudentApi<unknown>("/student/notifications/read-all", {
      method: "PATCH",
      json: {},
      signal,
    });
  },
};

export default studentService;
