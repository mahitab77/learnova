"use client";

/**
 * ============================================================================
 * RequestsApprovalsDonut (DROP-IN REPLACEMENT)
 * ----------------------------------------------------------------------------
 * Goal:
 * ✅ Same widget shell as OverviewTrendChart (identical card look)
 * ✅ Smaller, stable donut size (NO overflow)
 * ✅ Always renders (even 0/0 -> neutral ring + message)
 * ✅ Compact KPI row (professional dashboard feel, low height)
 * ============================================================================
 */

import { useMemo } from "react";
import type { Lang } from "../../adminTypes";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export interface RequestsApprovalsDonutProps {
  lang: Lang;
  requests: number;
  approvals: number;
}

export function RequestsApprovalsDonut({ lang, requests, approvals }: RequestsApprovalsDonutProps) {
  const total = requests + approvals;
  const rtl = lang === "ar";

  const title = lang === "ar" ? "الطلبات مقابل موافقات المعلمين" : "Requests vs Teacher Approvals";
  const subtitle = lang === "ar" ? "نظرة سريعة على الحالات المعلّقة" : "Quick look at pending items";
  const pill = lang === "ar" ? "معلّق" : "Pending";

  const data = useMemo(() => {
    if (total <= 0) {
      return [{ name: lang === "ar" ? "لا توجد بيانات" : "No data", value: 1 }];
    }
    return [
      { name: lang === "ar" ? "طلبات" : "Requests", value: requests },
      { name: lang === "ar" ? "موافقات" : "Approvals", value: approvals },
    ];
  }, [total, requests, approvals, lang]);

  const isEmpty = total <= 0;

  return (
    <WidgetCard lang={lang} title={title} subtitle={subtitle} pill={pill}>
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              stroke="transparent"
            >
              {isEmpty ? (
                <Cell />
              ) : (
                <>
                  <Cell />
                  <Cell />
                </>
              )}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* KPI row (compact + consistent) */}
      <div className={`mt-3 grid grid-cols-2 gap-2 ${rtl ? "text-right" : "text-left"}`}>
        <KpiMini label={lang === "ar" ? "طلبات معلّقة" : "Pending requests"} value={requests} />
        <KpiMini label={lang === "ar" ? "موافقات معلّقة" : "Pending approvals"} value={approvals} />
      </div>

      {isEmpty && (
        <EmptyHint>
          {lang === "ar" ? "لا توجد عناصر معلّقة حالياً." : "No pending items right now."}
        </EmptyHint>
      )}
    </WidgetCard>
  );
}

// -----------------------------------------------------------------------------
// Shared widget shell (identical to OverviewTrendChart)
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

function KpiMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      {children}
    </div>
  );
}
