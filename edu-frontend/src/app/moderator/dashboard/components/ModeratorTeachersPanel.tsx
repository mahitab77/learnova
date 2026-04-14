"use client";

import { useMemo, useState } from "react";
import type { Lang } from "../moderatorTypes";
import type { LangTexts } from "../moderatorTexts";
import type { ModeratorTeacherRow } from "@/src/services/moderatorService";

interface Props {
  lang: Lang;
  t: LangTexts;
  teachers: ModeratorTeacherRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const PAGE_SIZE = 15;

export function ModeratorTeachersPanel({ lang, t, teachers, loading, error, onRefresh }: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((tc) =>
      `${tc.name} ${tc.subjects ?? ""}`.toLowerCase().includes(term)
    );
  }, [teachers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  return (
    <section dir={dir} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.teachersTitle}</h2>
          <p className="text-xs text-slate-500">{t.teachersDesc}</p>
        </div>
        <button onClick={onRefresh} className="text-xs rounded-md border px-3 py-1 bg-white hover:bg-slate-50">
          {t.refresh}
        </button>
      </header>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t.teachersSearchPlaceholder}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
        />
      </div>

      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">{t.loading}</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">{t.teachersNone}</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.teachersColName}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.teachersColSubjects}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.teachersColStatus}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paged.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{tc.name}</td>
                    <td className="px-3 py-2 text-slate-500">{tc.subjects ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${tc.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {tc.is_active ? t.teachersStatusActive : t.teachersStatusInactive}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px]">
              <span>{lang === "ar" ? `صفحة ${safePage} من ${totalPages}` : `Page ${safePage} of ${totalPages}`}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2 py-1 rounded border disabled:opacity-50">
                  {lang === "ar" ? "السابق" : "Previous"}
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2 py-1 rounded border disabled:opacity-50">
                  {lang === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
