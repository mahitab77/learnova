// src/app/teacher/dashboard/panels/TeacherProfilePanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Lang, TeacherProfile, TeacherVideoRow } from "../teacherDashboardTypes";
import { Plus, Trash2, Star, Save, Copy, User2, Pencil, X } from "lucide-react";

export type TeacherProfilePanelProps = {
  lang: Lang;
  profile: TeacherProfile | null;

  // NOTE: Keep exact prop contract for DROP-IN safety.
  profileForm: { name: string; bio_short: string; phone: string; photo_url: string };
  onProfileFormChange: Dispatch<
    SetStateAction<{ name: string; bio_short: string; phone: string; photo_url: string }>
  >;
  onSaveProfile: () => void | Promise<void>;

  videos: TeacherVideoRow[];
  videoForm: { subject_id: string; video_url: string; make_primary: boolean };
  onVideoFormChange: Dispatch<
    SetStateAction<{ subject_id: string; video_url: string; make_primary: boolean }>
  >;
  onAddVideo: () => void | Promise<void>;
  onDeleteVideo: (videoId: number) => void | Promise<void>;
  onSetPrimaryVideo: (videoId: string | number) => void;
};

function asRecord(x: unknown): Record<string, unknown> {
  return (x ?? {}) as Record<string, unknown>;
}

function isPrimitive(v: unknown): v is string | number | boolean | null {
  return v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string") return v.trim() ? v : "—";
  return "—";
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore (some browsers block clipboard without user gesture)
  }
}

function norm(s: string): string {
  return (s ?? "").trim();
}

export default function TeacherProfilePanel({
  lang,
  profile,
  profileForm,
  onProfileFormChange,
  onSaveProfile,
  videos,
  videoForm,
  onVideoFormChange,
  onAddVideo,
  onDeleteVideo,
  onSetPrimaryVideo,
}: TeacherProfilePanelProps) {
  const ar = lang === "ar";

  // -----------------------------
  // Edit mode UX (requested)
  // -----------------------------
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Snapshot used for Cancel (taken when entering edit mode)
  const [snapshot, setSnapshot] = useState(profileForm);

  // Keep snapshot fresh when not editing (e.g., hook refreshes profileForm)
  useEffect(() => {
    if (!isEditing) setSnapshot(profileForm);
  }, [isEditing, profileForm]);

  const isDirty = useMemo(() => {
    return (
      norm(profileForm.name) !== norm(snapshot.name) ||
      norm(profileForm.phone) !== norm(snapshot.phone) ||
      norm(profileForm.bio_short) !== norm(snapshot.bio_short) ||
      norm(profileForm.photo_url) !== norm(snapshot.photo_url)
    );
  }, [profileForm, snapshot]);

  const startEdit = () => {
    setSnapshot(profileForm);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    onProfileFormChange(snapshot);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    try {
      setIsSaving(true);
      await onSaveProfile();
      setIsEditing(false);
      // Snapshot will be refreshed automatically when hook updates profileForm
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar source: prefer form value (what user is editing), else stored profile photo_url.
  const avatarSrc = useMemo(() => {
    const fromForm = profileForm.photo_url?.trim();
    if (fromForm) return fromForm;
    const fromProfile = profile?.photo_url?.trim();
    if (fromProfile) return fromProfile;
    return "";
  }, [profile?.photo_url, profileForm.photo_url]);

  const displayName =
    profileForm.name?.trim() || profile?.name?.trim() || profile?.user_full_name?.trim() || "—";

  const email = profile?.user_email?.trim() || "";

  // --- Show ALL available profile details (read-only) ---
  const allProfilePairs = useMemo(() => {
    const rec = asRecord(profile);
    const entries = Object.entries(rec)
      .filter(([, v]) => isPrimitive(v))
      .map(([k, v]) => ({ key: k, value: formatValue(v) }))
      // stable sort: IDs first, then the rest alphabetically
      .sort((a, b) => {
        const aId = a.key === "id" || a.key.endsWith("_id");
        const bId = b.key === "id" || b.key.endsWith("_id");
        if (aId && !bId) return -1;
        if (!aId && bId) return 1;
        return a.key.localeCompare(b.key);
      });

    return entries;
  }, [profile]);

  // Disabled styling helper for inputs
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400";
  const inputDisabledClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed";

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      {/* ====================================================== */}
      {/* Profile / Personal details (Editable + Read-only info)  */}
      {/* ====================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">{ar ? "الملف الشخصي" : "Profile"}</div>
            <div className="mt-0.5 text-xs text-slate-600">
              {ar
                ? "القيم قابلة للتعديل بعد الضغط على زر تعديل."
                : "Values are editable after clicking Edit."}
            </div>

            {isEditing ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                {ar ? "وضع التعديل" : "Edit mode"}
                {isDirty ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    {ar ? "تغييرات غير محفوظة" : "Unsaved changes"}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">
                    {ar ? "لا تغييرات" : "No changes"}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Identity badge */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <User2 className="h-4 w-4 text-slate-700" />
              <div className="min-w-0">
                <div className="max-w-[220px] truncate text-xs font-semibold text-slate-800">
                  {displayName}
                </div>
                {email ? (
                  <div className="max-w-[220px] truncate text-[11px] text-slate-600">{email}</div>
                ) : null}
              </div>
            </div>

            {/* Edit / Cancel / Save controls */}
            {!isEditing ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                {ar ? "تعديل" : "Edit"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  {ar ? "إلغاء" : "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={isSaving || !isDirty}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? (ar ? "جارٍ الحفظ..." : "Saving...") : ar ? "حفظ" : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* Avatar card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <User2 className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="w-full">
                <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "رابط الصورة" : "Photo URL"}</div>
                <input
                  value={profileForm.photo_url}
                  disabled={!isEditing}
                  onChange={(e) =>
                    onProfileFormChange((p) => ({
                      ...p,
                      photo_url: e.target.value,
                    }))
                  }
                  className={isEditing ? inputClass : inputDisabledClass}
                  placeholder={profile?.photo_url ?? ""}
                />
              </div>
            </div>
          </div>

          {/* Editable form (locked until Edit) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "الاسم" : "Name"}</div>
                <input
                  value={profileForm.name}
                  disabled={!isEditing}
                  onChange={(e) => onProfileFormChange((p) => ({ ...p, name: e.target.value }))}
                  className={isEditing ? inputClass : inputDisabledClass}
                  placeholder={profile?.user_full_name ?? ""}
                />
              </label>

              <label>
                <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "الهاتف" : "Phone"}</div>
                <input
                  value={profileForm.phone}
                  disabled={!isEditing}
                  onChange={(e) => onProfileFormChange((p) => ({ ...p, phone: e.target.value }))}
                  className={isEditing ? inputClass : inputDisabledClass}
                  placeholder={profile?.phone ?? ""}
                />
              </label>

              <label className="sm:col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "نبذة قصيرة" : "Bio (short)"}</div>
                <textarea
                  value={profileForm.bio_short}
                  disabled={!isEditing}
                  onChange={(e) => onProfileFormChange((p) => ({ ...p, bio_short: e.target.value }))}
                  className={
                    isEditing
                      ? "min-h-[84px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                      : "min-h-[84px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                  }
                  placeholder={profile?.bio_short ?? ""}
                />
              </label>

              {/* NOTE:
                  We intentionally DO NOT add other editable inputs here,
                  because your prop contract only supports these 4 fields.
                  If you expand profileForm in the hook + backend, we can render them here too. */}
            </div>
          </div>
        </div>

        {/* Read-only: all available profile fields */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            {ar ? "كل تفاصيل الحساب المتاحة" : "All Available Account Details"}
          </div>
          <div className="text-xs text-slate-600">
            {ar ? "هذه بيانات القراءة فقط كما يسترجعها النظام." : "These are read-only values as returned by the backend."}
          </div>

          {!profile ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              {ar ? "لا توجد بيانات ملف." : "No profile data."}
            </div>
          ) : allProfilePairs.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              {ar ? "لا توجد حقول متاحة." : "No fields available."}
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {allProfilePairs.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-600">{p.key}</div>
                    <div className="truncate text-xs font-semibold text-slate-900">{p.value}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copyToClipboard(p.value === "—" ? "" : p.value)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                    aria-label="Copy"
                    title={ar ? "نسخ" : "Copy"}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================== */}
      {/* Videos (unchanged)    */}
      {/* ===================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <div className="text-sm font-semibold text-slate-900">{ar ? "فيديوهات" : "Videos"}</div>
          <div className="mt-0.5 text-xs text-slate-600">{ar ? "إضافة روابط فيديو للمادة" : "Add subject video links"}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-1">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "subject_id" : "subject_id"}</div>
            <input
              value={videoForm.subject_id}
              onChange={(e) => onVideoFormChange((p) => ({ ...p, subject_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>

          <label className="sm:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-700">{ar ? "video_url" : "video_url"}</div>
            <input
              value={videoForm.video_url}
              onChange={(e) => onVideoFormChange((p) => ({ ...p, video_url: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>

          <label className="sm:col-span-2 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={videoForm.make_primary}
              onChange={(e) => onVideoFormChange((p) => ({ ...p, make_primary: e.target.checked }))}
            />
            <span className="text-xs font-semibold text-slate-700">{ar ? "تعيين كأساسي" : "Set as primary"}</span>
          </label>

          <button
            type="button"
            onClick={() => void onAddVideo()}
            className="sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {ar ? "إضافة" : "Add"}
          </button>
        </div>

        <div className="mt-4">
          {videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {ar ? "لا توجد فيديوهات." : "No videos."}
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {ar ? v.subject_name_ar : v.subject_name_en} — subject_id: {v.subject_id}
                    </div>
                    <div className="truncate text-xs text-slate-600">{v.video_url}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSetPrimaryVideo(v.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Star className="h-4 w-4" />
                      {Number(v.is_primary) === 1 ? (ar ? "أساسي" : "Primary") : (ar ? "تعيين أساسي" : "Set primary")}
                    </button>

                    <button
                      type="button"
                      onClick={() => void onDeleteVideo(v.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      {ar ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
