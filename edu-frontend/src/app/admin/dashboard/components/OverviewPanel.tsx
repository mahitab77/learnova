"use client";

/**
 * ============================================================================
 * OverviewPanel (DROP-IN REPLACEMENT)
 * ----------------------------------------------------------------------------
 * FIX:
 * ✅ Remove any extra "chart wrapper cards" from this panel (prevents nested cards)
 * ✅ Keep panel compact (smaller spacing + smaller stat cards)
 * ✅ Let chart components own their card UI (consistent sizing + professional look)
 * ✅ Keep ALL existing business logic + debug logs
 * ============================================================================
 */

import { useEffect, useMemo } from "react";
import type {
  Lang,
  AdminOverview,
  ParentRequestRow,
  TeacherAdminRow,
  StudentAdminRow,
} from "../adminTypes";
import type { LangTexts } from "../adminTexts";

import { OverviewTrendChart } from "./charts/OverviewTrendChart";
import { RequestsApprovalsDonut } from "./charts/RequestsApprovalsDonut";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
export interface OverviewPanelProps {
  lang: Lang;
  t: LangTexts;

  overview: AdminOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;
  loadOverview: () => void;

  students: StudentAdminRow[];
  teachers: TeacherAdminRow[];

  requests: ParentRequestRow[];
  pendingTeachers: TeacherAdminRow[];
}

// -----------------------------------------------------------------------------
// Helpers (strict, no any)
// -----------------------------------------------------------------------------
function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function pickNumber(
  obj: Record<string, unknown> | null,
  keys: string[],
  fallback = 0
): number {
  if (!obj) return fallback;
  for (const k of keys) {
    if (k in obj) return toNumber(obj[k], fallback);
  }
  return fallback;
}

function safeGetRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

function parseAnyDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function isTruthyActive(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "active") return true;
    if (s === "0" || s === "false" || s === "inactive") return false;
  }
  return false;
}

function isPendingStatus(v: unknown): boolean {
  if (typeof v === "string") return v.toLowerCase().includes("pending");
  if (typeof v === "number") return v === 0;
  if (typeof v === "boolean") return v === false;
  return false;
}

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type TrendPoint = { date: string; students: number; teachers: number };

function buildLastNDaysSkeleton(nDays: number): TrendPoint[] {
  const out: TrendPoint[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = nDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ date: formatYYYYMMDD(d), students: 0, teachers: 0 });
  }
  return out;
}

function withinLastNDays(d: Date, nDays: number): boolean {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - (nDays - 1));

  const endExclusive = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  endExclusive.setDate(endExclusive.getDate() + 1);

  return d >= start && d < endExclusive;
}

function extractCreatedAt(rec: Record<string, unknown>): Date | null {
  const keys = ["created_at", "createdAt", "created", "createdOn", "created_on"];
  for (const k of keys) {
    if (k in rec) {
      const d = parseAnyDate(rec[k]);
      if (d) return d;
    }
  }
  return null;
}

function extractIsActive(rec: Record<string, unknown>): boolean {
  const keys = ["is_active", "isActive", "active", "enabled"];
  for (const k of keys) {
    if (k in rec) return isTruthyActive(rec[k]);
  }
  return false;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export function OverviewPanel({
  lang,
  t,
  overview,
  overviewLoading,
  overviewError,
  loadOverview,
  students,
  teachers,
  requests,
  pendingTeachers,
}: OverviewPanelProps) {
  const o = useMemo(
    () => (overview ? (overview as unknown as Record<string, unknown>) : null),
    [overview]
  );

  const activeStudents = useMemo(
    () =>
      pickNumber(
        o,
        ["activeStudents", "studentsActive", "active_students", "students_active"],
        0
      ),
    [o]
  );

  const activeParents = useMemo(
    () =>
      pickNumber(o, ["activeParents", "parentsActive", "active_parents", "parents_active"], 0),
    [o]
  );

  const activeTeachers = useMemo(
    () =>
      pickNumber(
        o,
        ["activeTeachers", "teachersActive", "active_teachers", "teachers_active"],
        0
      ),
    [o]
  );

  const subjectsCount = useMemo(
    () => pickNumber(o, ["subjects", "subjectsCount", "subjects_count"], 0),
    [o]
  );

  const newActiveTrend = useMemo<TrendPoint[]>(() => {
    const skeleton = buildLastNDaysSkeleton(30);
    const map = new Map<string, { students: number; teachers: number }>();
    for (const p of skeleton) map.set(p.date, { students: 0, teachers: 0 });

    for (const row of students) {
      const rec = safeGetRecord(row);
      if (!rec) continue;

      const createdAt = extractCreatedAt(rec);
      if (!createdAt) continue;
      if (!withinLastNDays(createdAt, 30)) continue;
      if (!extractIsActive(rec)) continue;

      const key = formatYYYYMMDD(createdAt);
      const cur = map.get(key);
      if (!cur) continue;
      cur.students += 1;
      map.set(key, cur);
    }

    for (const row of teachers) {
      const rec = safeGetRecord(row);
      if (!rec) continue;

      const createdAt = extractCreatedAt(rec);
      if (!createdAt) continue;
      if (!withinLastNDays(createdAt, 30)) continue;
      if (!extractIsActive(rec)) continue;

      const key = formatYYYYMMDD(createdAt);
      const cur = map.get(key);
      if (!cur) continue;
      cur.teachers += 1;
      map.set(key, cur);
    }

    return skeleton.map((p) => ({
      date: p.date,
      students: map.get(p.date)?.students ?? 0,
      teachers: map.get(p.date)?.teachers ?? 0,
    }));
  }, [students, teachers]);

  const pendingRequestsCount = useMemo(() => {
    return requests.filter((r) => {
      const rec = safeGetRecord(r);
      if (!rec) return false;

      if ("status" in rec) return isPendingStatus(rec.status);
      if ("request_status" in rec) return isPendingStatus(rec.request_status);
      if ("state" in rec) return isPendingStatus(rec.state);

      return false;
    }).length;
  }, [requests]);

  const pendingApprovalsCount = useMemo(() => pendingTeachers.length, [pendingTeachers]);

  useEffect(() => {
    console.log("[OverviewPanel] arrays:", {
      students: students.length,
      teachers: teachers.length,
      requests: requests.length,
      pendingTeachers: pendingTeachers.length,
    });

    const studentKeys = Object.keys(safeGetRecord(students[0]) ?? {});
    const teacherKeys = Object.keys(safeGetRecord(teachers[0]) ?? {});
    const requestKeys = Object.keys(safeGetRecord(requests[0]) ?? {});

    console.log("[OverviewPanel] sample keys:", {
      studentKeys,
      teacherKeys,
      requestKeys,
    });

    const s0 = safeGetRecord(students[0]);
    const t0 = safeGetRecord(teachers[0]);

    console.log("[OverviewPanel] created_at + is_active extraction:", {
      student0_createdAt: s0 ? extractCreatedAt(s0) : null,
      student0_isActive: s0 ? extractIsActive(s0) : null,
      teacher0_createdAt: t0 ? extractCreatedAt(t0) : null,
      teacher0_isActive: t0 ? extractIsActive(t0) : null,
    });

    console.log("[OverviewPanel] trend sample:", newActiveTrend.slice(0, 5));
  }, [students, teachers, requests, pendingTeachers, newActiveTrend]);

  return (
    <section className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t.overviewTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.overviewDesc}</p>
      </div>

      {/* Error */}
      {overviewError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{overviewError}</p>
            <button
              onClick={loadOverview}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-rose-700 border border-rose-200 hover:bg-rose-100"
            >
              {t.retry}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {overviewLoading && !overview && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          {t.loading}
        </div>
      )}

      {/* Stats (compact) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard value={activeStudents} label={t.overviewStudents} icon="🧑‍🎓" />
        <StatCard value={activeParents} label={t.overviewParents} icon="👨‍👩‍👧‍👦" />
        <StatCard value={activeTeachers} label={t.overviewTeachers} icon="🧑‍🏫" />
        <StatCard value={subjectsCount} label={t.overviewSubjects} icon="📚" />
        <StatCard value={pendingRequestsCount} label={t.overviewPendingRequests} icon="⏳" />
        <StatCard value={pendingApprovalsCount} label={t.overviewPendingApprovals} icon="✅" />
      </div>

      {/* Charts (NO extra wrapper cards — chart components already render cards) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 min-w-0">
        <OverviewTrendChart lang={lang} data={newActiveTrend} />
        <RequestsApprovalsDonut
          lang={lang}
          requests={pendingRequestsCount}
          approvals={pendingApprovalsCount}
        />
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Stat card (compact + clean)
// -----------------------------------------------------------------------------
function StatCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold leading-tight text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-700">{label}</div>
        </div>
        <div className="text-xl" aria-hidden>
          {icon}
        </div>
      </div>
    </div>
  );
}
