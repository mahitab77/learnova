"use client";

/**
 * ============================================================================
 * OverviewTrendChart (DROP-IN REPLACEMENT)
 * ----------------------------------------------------------------------------
 * Goal:
 * ✅ Smaller card footprint
 * ✅ Professional widget header (title + subtitle + pill)
 * ✅ Stable chart area height (prevents layout jumps)
 * ✅ Clean empty state inside the card (still looks identical)
 * ============================================================================
 */

import { useMemo } from "react";
import type { Lang } from "../../adminTypes";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type TrendPoint = { date: string; students: number; teachers: number };

export function OverviewTrendChart({
  lang,
  data,
}: {
  lang: Lang;
  data: TrendPoint[];
}) {
  const isEmpty = useMemo(
    () => data.every((p) => (p.students ?? 0) === 0 && (p.teachers ?? 0) === 0),
    [data]
  );

  const title = lang === "ar" ? "اتجاه المستخدمين النشطين الجدد" : "New Active Users Trend";
  const subtitle =
    lang === "ar" ? "طلاب ومعلمين — آخر 30 يوم" : "Students & teachers — last 30 days";
  const pill = lang === "ar" ? "30 يوم" : "30 days";

  return (
    <WidgetCard lang={lang} title={title} subtitle={subtitle} pill={pill}>
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickMargin={8}
              tick={{ fontSize: 11 }}
              minTickGap={18}
            />
            <YAxis tick={{ fontSize: 11 }} width={30} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="students" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="teachers" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {isEmpty && (
        <EmptyHint>
          {lang === "ar"
            ? "لا توجد بيانات خلال آخر 30 يوم."
            : "No data available for the last 30 days."}
        </EmptyHint>
      )}
    </WidgetCard>
  );
}

// -----------------------------------------------------------------------------
// Shared widget shell (keeps all chart cards identical)
// -----------------------------------------------------------------------------
function WidgetCard({
  lang,
  title,
  subtitle,
  pill,
  children,
}: {
  lang: Lang;
  title: string;
  subtitle: string;
  pill: string;
  children: React.ReactNode;
}) {
  const rtl = lang === "ar";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className={`min-w-0 ${rtl ? "text-right" : "text-left"}`}>
          <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
          <div className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</div>
        </div>
        <div className="shrink-0">
          <Pill text={pill} />
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          {children}
        </div>
      </div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {text}
    </span>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      {children}
    </div>
  );
}
