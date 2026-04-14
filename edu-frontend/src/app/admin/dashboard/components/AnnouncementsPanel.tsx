// src/app/admin/dashboard/components/AnnouncementsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import type { Lang, AnnouncementRow } from "../adminTypes";
import type { LangTexts } from "../adminTexts";

type Props = {
  lang: Lang;
  t: LangTexts;

  announcements: AnnouncementRow[];
  loading: boolean;
  error: string | null;

  onCreate: (data: {
    title: string;
    body: string;
    audience?: "all" | "students" | "parents" | "teachers";
  }) => Promise<void>;

  onRefresh?: () => Promise<void>;
};

function formatDateTime(iso: string, lang: Lang): string {
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

export default function AnnouncementsPanel({
  lang,
  t,
  announcements,
  loading,
  error,
  onCreate,
  onRefresh,
}: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    title: string;
    body: string;
    audience: "all" | "students" | "parents" | "teachers";
  }>({
    title: "",
    body: "",
    audience: "all",
  });

  const audienceLabel = useMemo(() => {
    return (aud: AnnouncementRow["audience"]) => {
      switch (aud) {
        case "all":
          return t.announcementsAudienceAll;
        case "students":
          return t.announcementsAudienceStudents;
        case "parents":
          return t.announcementsAudienceParents;
        case "teachers":
          return t.announcementsAudienceTeachers;
        default:
          return aud;
      }
    };
  }, [
    t.announcementsAudienceAll,
    t.announcementsAudienceStudents,
    t.announcementsAudienceParents,
    t.announcementsAudienceTeachers,
  ]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      setCreateError(lang === "ar" ? "يرجى إدخال العنوان والمحتوى" : "Title and content are required.");
      return;
    }

    try {
      setCreating(true);
      await onCreate({ title, body, audience: form.audience });
      setForm({ title: "", body: "", audience: "all" });
      setShowCreate(false);
      if (onRefresh) await onRefresh();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : (lang === "ar" ? "فشل إنشاء الإعلان" : "Failed to create announcement"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section dir={dir} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.announcementsTitle}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.announcementsDesc}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void (onRefresh ? onRefresh() : Promise.resolve())}
            className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm hover:bg-slate-200"
          >
            {t.refresh}
          </button>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-600"
          >
            {t.announcementsCreateNew}
          </button>
        </div>
      </header>

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-28 bg-slate-200 rounded" />
          <div className="h-28 bg-slate-200 rounded" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {showCreate && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-slate-900 mb-4">{t.announcementsCreateNew}</h3>

          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-red-700 text-sm">{createError}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.announcementsTitle}
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder={t.announcementsTitlePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.announcementsBodyLabel}
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                rows={4}
                placeholder={t.announcementsBodyPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.announcementsAudience}
              </label>
              <select
                value={form.audience}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    audience: e.target.value as AnnouncementRow["audience"],
                  }))
                }
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">{t.announcementsAudienceAll}</option>
                <option value="students">{t.announcementsAudienceStudents}</option>
                <option value="parents">{t.announcementsAudienceParents}</option>
                <option value="teachers">{t.announcementsAudienceTeachers}</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-600 disabled:opacity-60"
              >
                {creating ? (lang === "ar" ? "جاري الإنشاء..." : "Creating...") : t.announcementsCreate}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="bg-slate-500 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-600"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-slate-500">{t.announcementsNone}</div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                        {audienceLabel(a.audience)}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {formatDateTime(a.created_at, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-700 whitespace-pre-wrap">{a.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
