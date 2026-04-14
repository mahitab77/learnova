"use client";

import { useMemo, useState } from "react";
import type { Lang } from "../moderatorTypes";
import type { LangTexts } from "../moderatorTexts";
import type { ModeratorStudentRow } from "@/src/services/moderatorService";
import { formatDateTime } from "../moderatorTypes";

interface Props {
  lang: Lang;
  t: LangTexts;
  students: ModeratorStudentRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const PAGE_SIZE = 15;

export function ModeratorStudentsPanel({ lang, t, students, loading, error, onRefresh }: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      `${s.full_name} ${s.email}`.toLowerCase().includes(term)
    );
  }, [students, search]);

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
          <h2 className="text-lg font-semibold text-slate-900">{t.studentsTitle}</h2>
          <p className="text-xs text-slate-500">{t.studentsDesc}</p>
        </div>
        <button onClick={onRefresh} className="text-xs rounded-md border px-3 py-1 bg-white hover:bg-slate-50">
          {t.refresh}
        </button>
      </header>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t.studentsSearchPlaceholder}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
        />
      </div>

      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">{t.loading}</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">{t.studentsNone}</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsColName}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsColEmail}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsColLang}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsColStatus}</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">{t.studentsColCreated}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paged.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.full_name}</td>
                    <td className="px-3 py-2 text-slate-500">{s.email}</td>
                    <td className="px-3 py-2 text-slate-500">{s.preferred_lang ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {s.is_active ? t.studentsStatusActive : t.studentsStatusInactive}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{formatDateTime(s.created_at, lang)}</td>
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
