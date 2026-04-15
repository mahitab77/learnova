import type { Lang, StudentProfileData, StudentOverviewData } from "./studentTypes";

export type GradeCatalog = {
  systems: Array<{ id: number; name: string; code: string }>;
  stages: Array<{ id: number; systemId: number; nameEn: string; nameAr: string; code: string }>;
  levels: Array<{ id: number; stageId: number; nameEn: string; nameAr: string; code: string }>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback: number | null = null): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export function normalizeProfileResponse(raw: unknown): StudentProfileData {
  const empty: StudentProfileData = {
    user: { id: 0, fullName: "", email: "", preferredLang: null },
    student: {
      id: 0,
      systemId: null,
      stageId: null,
      gradeLevelId: null,
      // Transitional compatibility only; normalized ids are authoritative.
      gradeStage: null,
      gradeNumber: null,
      gender: null,
      onboardingCompleted: false,
    },
    parents: [],
  };

  if (!isRecord(raw)) return empty;

  const userRaw = isRecord(raw.user) ? raw.user : null;
  const studentRaw = isRecord(raw.student) ? raw.student : null;
  const parentsRaw = asArray(raw.parents).filter(isRecord);

  return {
    user: {
      id: asNumber(userRaw?.id, 0) ?? 0,
      fullName: asString(userRaw?.fullName, ""),
      email: asString(userRaw?.email, ""),
      preferredLang:
        typeof userRaw?.preferredLang === "string"
          ? userRaw.preferredLang
          : null,
    },
    student: {
      id: asNumber(studentRaw?.id, 0) ?? 0,
      systemId: asNumber(studentRaw?.systemId, null),
      stageId: asNumber(studentRaw?.stageId, null),
      gradeLevelId: asNumber(studentRaw?.gradeLevelId, null),
      // Transitional compatibility only; do not treat as source-of-truth.
      gradeStage:
        typeof studentRaw?.gradeStage === "string"
          ? studentRaw.gradeStage
          : null,
      gradeNumber: asNumber(studentRaw?.gradeNumber, null),
      gender:
        studentRaw?.gender === "male" || studentRaw?.gender === "female"
          ? studentRaw.gender
          : null,
      onboardingCompleted: asBool(studentRaw?.onboardingCompleted, false),
    },
    parents: parentsRaw.map((p) => ({
      parentId: asNumber(p.parentId, 0) ?? 0,
      fullName: asString(p.fullName, ""),
      relationship:
        p.relationship === "mother" ||
        p.relationship === "father" ||
        p.relationship === "guardian"
          ? p.relationship
          : "guardian",
    })),
  };
}

export function buildNormalizedAcademicScopeLabel(
  overviewData: StudentOverviewData | null,
  gradeCatalog: GradeCatalog | null,
  lang: Lang,
  gradeLabel: string
): string {
  const student = overviewData?.student;
  if (!student) return "";

  const stage = gradeCatalog?.stages.find((st) => st.id === student.stageId);
  const level = gradeCatalog?.levels.find((lv) => lv.id === student.gradeLevelId);
  const stageLabel = stage
    ? lang === "ar"
      ? stage.nameAr || stage.nameEn
      : stage.nameEn || stage.nameAr
    : student.stageId
      ? `${lang === "ar" ? "المرحلة" : "Stage"} #${student.stageId}`
      : "";
  const levelLabel = level
    ? lang === "ar"
      ? level.nameAr || level.nameEn
      : level.nameEn || level.nameAr
    : student.gradeLevelId
      ? `${lang === "ar" ? "الصف" : "Level"} #${student.gradeLevelId}`
      : "";

  if (stageLabel && levelLabel) return `${gradeLabel} ${stageLabel} - ${levelLabel}`;
  if (stageLabel) return `${gradeLabel} ${stageLabel}`;
  // Legacy compatibility fallback only when normalized ids are unavailable.
  if (!stageLabel && !levelLabel && student.gradeStage) {
    return `${gradeLabel} ${student.gradeStage} ${student.gradeNumber ?? ""}`.trim();
  }
  // Legacy compatibility fallback only when normalized ids are unavailable.
  if (!stageLabel && !levelLabel && student.gradeNumber) {
    return `${gradeLabel} ${student.gradeNumber}`;
  }
  return "";
}
