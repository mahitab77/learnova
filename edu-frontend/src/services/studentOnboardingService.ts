import { API_BASE, apiFetch } from "@/src/lib/api";

export type OnboardingTeacherOption = {
  id: string;
  name: string;
  ratingAvg: number | null;
  ratingCount: number;
};

export type OnboardingTeacherVideoClip = {
  title: string;
  url: string;
};

export type OnboardingTeacherDetails = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  videoClips: OnboardingTeacherVideoClip[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resolveMediaUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = API_BASE.replace(/\/+$/, "");
  const baseNoApi = base.replace(/\/api\/?$/i, "");
  if (url.startsWith("/")) return `${baseNoApi}${url}`;
  return `${baseNoApi}/${url}`;
}

function normalizeTeacherRow(row: unknown): OnboardingTeacherOption | null {
  if (!isRecord(row)) return null;
  const idSource = row._id ?? row.id;
  if (idSource === undefined || idSource === null) return null;

  const name =
    (typeof row.name === "string" && row.name.trim()) ||
    (typeof row.full_name === "string" && row.full_name.trim()) ||
    "";
  if (!name) return null;

  const ratingAvg =
    row.rating_avg !== null &&
    row.rating_avg !== undefined &&
    !Number.isNaN(Number(row.rating_avg))
      ? Number(row.rating_avg)
      : null;
  const ratingCount = Number(row.rating_count || 0);

  return {
    id: String(idSource),
    name,
    ratingAvg,
    ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
  };
}

function normalizeTeacherDetailsResponse(
  body: unknown,
  fallbackId: string
): OnboardingTeacherDetails | null {
  if (!isRecord(body) || body.success !== true || !isRecord(body.data)) return null;
  const raw = body.data;
  const idSource = raw._id ?? raw.id ?? raw.teacherId ?? fallbackId;
  const id = String(idSource);

  const name =
    (typeof raw.name === "string" && raw.name.trim()) ||
    (typeof raw.full_name === "string" && raw.full_name.trim()) ||
    "";
  if (!name) return null;

  const photoUrl =
    (typeof raw.photoUrl === "string" && raw.photoUrl.trim()) ||
    (typeof raw.photo_url === "string" && raw.photo_url.trim()) ||
    (typeof raw.avatarUrl === "string" && raw.avatarUrl.trim()) ||
    null;

  const bio =
    (typeof raw.bio === "string" && raw.bio.trim()) ||
    (typeof raw.bioShort === "string" && raw.bioShort.trim()) ||
    (typeof raw.bio_short === "string" && raw.bio_short.trim()) ||
    null;

  const clips: OnboardingTeacherVideoClip[] = [];
  const pushClip = (title: string, url: string) => {
    const fullUrl = resolveMediaUrl(url);
    if (!fullUrl) return;
    clips.push({ title: title.trim() || "Video", url: fullUrl });
  };

  const primary =
    (typeof raw.primaryVideoUrl === "string" && raw.primaryVideoUrl.trim()) ||
    (typeof raw.primary_video_url === "string" && raw.primary_video_url.trim()) ||
    null;
  if (primary) pushClip("Primary clip", primary);

  const listSource = raw.videoClips ?? raw.videos ?? raw.clips;
  if (Array.isArray(listSource)) {
    for (const item of listSource) {
      if (!isRecord(item)) continue;
      const title =
        (typeof item.title === "string" && item.title.trim()) ||
        (typeof item.name === "string" && item.name.trim()) ||
        "Video";
      const url =
        (typeof item.url === "string" && item.url.trim()) ||
        (typeof item.videoUrl === "string" && item.videoUrl.trim()) ||
        null;
      if (url) pushClip(title, url);
    }
  }

  return { id, name, photoUrl: resolveMediaUrl(photoUrl), bio, videoClips: clips };
}

export const studentOnboardingService = {
  async listTeachersForSubject(subjectId: string): Promise<OnboardingTeacherOption[]> {
    const body = await apiFetch<unknown>(
      `/student/teachers?subjectId=${encodeURIComponent(subjectId)}`
    );
    if (!isRecord(body) || body.success !== true || !Array.isArray(body.data)) {
      return [];
    }
    return body.data
      .map((item) => normalizeTeacherRow(item))
      .filter((item): item is OnboardingTeacherOption => item !== null);
  },

  async getTeacherDetails(
    teacherId: string,
    subjectId?: string
  ): Promise<OnboardingTeacherDetails | null> {
    const query = subjectId
      ? `?subjectId=${encodeURIComponent(subjectId)}`
      : "";
    const body = await apiFetch<unknown>(
      `/student/teachers/${encodeURIComponent(teacherId)}${query}`
    );
    return normalizeTeacherDetailsResponse(body, teacherId);
  },
};

export default studentOnboardingService;
