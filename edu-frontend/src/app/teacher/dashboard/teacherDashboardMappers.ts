import type {
  GradeCatalogLevel,
  GradeCatalogStage,
  GradeCatalogSystem,
  ScheduleSlotRow,
  SlotOfferingsResponseRow,
  TeacherAnnouncementRow,
  TeacherNotificationApiResponse,
  TeacherNotificationInbox,
  TeacherNotificationRow,
  TeacherSubjectRow,
} from "./teacherDashboardTypes";
import { teacherTypeUtils } from "./teacherDashboardTypes";

export type GradeCatalogState = {
  systems: GradeCatalogSystem[];
  stages: GradeCatalogStage[];
  levels: GradeCatalogLevel[];
};

export const EMPTY_GRADE_CATALOG: GradeCatalogState = {
  systems: [],
  stages: [],
  levels: [],
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

function getProp(v: Record<string, unknown>, key: string): unknown {
  return v[key];
}

export function unwrapData<T>(raw: unknown): T {
  if (!isRecord(raw) || !("data" in raw)) {
    throw new Error("Invalid API response shape.");
  }

  const success =
    ("success" in raw && raw.success === true) ||
    ("ok" in raw && raw.ok === true);

  if (!success) {
    const message = typeof raw.message === "string" ? raw.message : "Request failed";
    throw new Error(message);
  }

  return raw.data as T;
}

export function asArray<T>(raw: unknown): T[] {
  const v = unwrapData<unknown>(raw);
  return Array.isArray(v) ? (v as T[]) : [];
}

export function safeTrim(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function normalizeCanonicalWeekday(value: unknown): number {
  const weekday = Number(value);
  if (!Number.isFinite(weekday)) return 1;
  const normalized = Math.trunc(weekday);
  if (normalized === 0) return 7;
  if (normalized >= 1 && normalized <= 7) return normalized;
  return 1;
}

export function normalizeScheduleSlotRows(raw: unknown): ScheduleSlotRow[] {
  return asArray<ScheduleSlotRow>(raw).map((slot) => ({
    ...slot,
    weekday: normalizeCanonicalWeekday(slot.weekday),
  }));
}

export function normalizeSlotOfferingRows(raw: unknown): SlotOfferingsResponseRow[] {
  return asArray<SlotOfferingsResponseRow>(raw);
}

export function normalizeTeacherSubjectRows(raw: unknown): TeacherSubjectRow[] {
  return asArray<TeacherSubjectRow>(raw);
}

export function normalizeGradeCatalog(raw: unknown): GradeCatalogState {
  if (!isRecord(raw)) return EMPTY_GRADE_CATALOG;

  return {
    systems: Array.isArray(raw.systems)
      ? (raw.systems as GradeCatalogSystem[])
      : [],
    stages: Array.isArray(raw.stages)
      ? (raw.stages as GradeCatalogStage[])
      : [],
    levels: Array.isArray(raw.levels)
      ? (raw.levels as GradeCatalogLevel[])
      : [],
  };
}

function normalizeNotificationRow(backendRow: unknown): TeacherNotificationRow {
  const r = isRecord(backendRow) ? backendRow : {};

  const id = Number(getProp(r, "id")) || 0;
  const type =
    typeof getProp(r, "type") === "string" ? String(getProp(r, "type")) : "";
  const title =
    typeof getProp(r, "title") === "string" ? String(getProp(r, "title")) : "";

  const bodyRaw = getProp(r, "body");
  const messageRaw = getProp(r, "message");
  const body =
    typeof bodyRaw === "string"
      ? bodyRaw
      : typeof messageRaw === "string"
      ? messageRaw
      : null;

  const relatedTypeRaw = getProp(r, "relatedType") ?? getProp(r, "related_type");
  const relatedType = typeof relatedTypeRaw === "string" ? relatedTypeRaw : null;

  const relatedIdRaw = getProp(r, "relatedId") ?? getProp(r, "related_id");
  const relatedId =
    typeof relatedIdRaw === "number"
      ? relatedIdRaw
      : Number.isFinite(Number(relatedIdRaw))
      ? Number(relatedIdRaw)
      : null;

  const isReadRaw = getProp(r, "isRead");
  const isReadNormalized = teacherTypeUtils.normalizeIsRead(
    typeof isReadRaw === "boolean" || isReadRaw === 0 || isReadRaw === 1
      ? isReadRaw
      : 0
  );

  const readAtRaw = getProp(r, "readAt") ?? getProp(r, "read_at");
  const readAt = typeof readAtRaw === "string" ? readAtRaw : null;
  const createdAtRaw = getProp(r, "createdAt") ?? getProp(r, "created_at");
  const createdAt = typeof createdAtRaw === "string" ? createdAtRaw : null;

  return {
    id,
    type,
    title,
    body,
    relatedType,
    relatedId,
    isRead: isReadNormalized,
    readAt,
    createdAt,
  };
}

export function normalizeAnnouncementRow(backendRow: unknown): TeacherAnnouncementRow {
  const r = isRecord(backendRow) ? backendRow : {};

  const id = Number(getProp(r, "id")) || 0;
  const titleRaw = getProp(r, "title");
  const title = typeof titleRaw === "string" ? titleRaw : "";
  const bodyRaw = getProp(r, "body");
  const contentRaw = getProp(r, "content");
  const body =
    typeof bodyRaw === "string"
      ? bodyRaw
      : typeof contentRaw === "string"
      ? contentRaw
      : "";
  const audienceRaw = getProp(r, "audience");
  const audience =
    audienceRaw === "all" ||
    audienceRaw === "students" ||
    audienceRaw === "parents" ||
    audienceRaw === "teachers"
      ? audienceRaw
      : "all";
  const createdAtRaw = getProp(r, "createdAt") ?? getProp(r, "created_at");
  const createdAt = typeof createdAtRaw === "string" ? createdAtRaw : null;

  return { id, title, body, audience, createdAt };
}

export function normalizeTeacherInbox(
  raw: TeacherNotificationApiResponse
): TeacherNotificationInbox {
  if (Array.isArray(raw)) {
    const items = raw.map(normalizeNotificationRow);
    const unreadCount = items.reduce((acc, n) => {
      const isRead = teacherTypeUtils.normalizeIsRead(n.isRead);
      return acc + (isRead ? 0 : 1);
    }, 0);
    return { unreadCount, items };
  }

  const obj = isRecord(raw) ? raw : {};
  const rawItems = Array.isArray(getProp(obj, "items"))
    ? (getProp(obj, "items") as unknown[])
    : [];
  const items = rawItems.map(normalizeNotificationRow);
  const unreadCountRaw = getProp(obj, "unreadCount");
  const unreadCount =
    typeof unreadCountRaw === "number"
      ? unreadCountRaw
      : items.reduce((acc, n) => {
          const isRead = teacherTypeUtils.normalizeIsRead(n.isRead);
          return acc + (isRead ? 0 : 1);
        }, 0);
  return { unreadCount, items };
}
