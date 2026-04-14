"use client";
/**
 * Parent Dashboard – Account Tab
 * ----------------------------------------------------------------
 * Responsibilities:
 *  - Placeholder for future parent account settings.
 *  - Bilingual + RTL-aware layout.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import { parentDashboardTexts } from "../parentDashboardTexts";

function ParentAccountPageContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = parentDashboardTexts[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-6" dir={dir}>
      <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">{t.accountTitle}</h1>
        <p className="text-sm text-slate-500">{t.accountSubtitle}</p>
      </header>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <div className="mb-3 flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <span className="font-medium">{t.accountSectionTitle}</span>
        </div>
        <p>
          {lang === "ar"
            ? "سيتم إضافة إعدادات الحساب وتفضيلات الإشعارات قريبًا."
            : "Account settings and notification preferences will be added soon."}
        </p>
      </section>
    </div>
  );
}

function ParentAccountPageFallback() {
  return <div className="space-y-6"><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /></div>;
}

export default function ParentAccountPage() {
  return (
    <Suspense fallback={<ParentAccountPageFallback />}>
      <ParentAccountPageContent />
    </Suspense>
  );
}
