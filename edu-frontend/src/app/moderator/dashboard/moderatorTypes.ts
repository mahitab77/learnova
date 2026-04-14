// src/app/moderator/dashboard/moderatorTypes.ts
// ============================================================================
// Moderator Dashboard Types
// ============================================================================

export type Lang = "en" | "ar";

export type TabKey = "sessions" | "students" | "teachers" | "homework" | "quizzes";

export type ModeratorUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

// Re-export service types for use in panels
export type {
  ModeratorSessionRow,
  ModeratorSessionStudentRow,
  ModeratorStudentRow,
  ModeratorTeacherRow,
  ModeratorHomeworkRow,
  ModeratorQuizRow,
} from "@/src/services/moderatorService";

export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
