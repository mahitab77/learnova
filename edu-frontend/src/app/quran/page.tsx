// src/app/quran/page.tsx
"use client";

/**
 * Quran & Islamic Studies — قرآن ومواد شرعية
 * -----------------------------------------------------------------------------
 * Purpose:
 * - Dedicated explore page for Quran recitation, Tajweed, memorization, and
 *   Islamic studies (fiqh/aqeedah/seerah/ethics) in a premium friendly UI.
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BookText,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

type Lang = "en" | "ar";

function t(lang: Lang, en: string, ar: string) {
  return lang === "ar" ? ar : en;
}

type Program = {
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  bulletsEn: string[];
  bulletsAr: string[];
  accent: string;
};

function QuranPageContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";
  const textAlign = isRTL ? "text-right" : "text-left";

  const programs = useMemo<Program[]>(
    () => [
      {
        titleEn: "Quran Recitation (Tajweed)",
        titleAr: "تلاوة القرآن (تجويد)",
        descEn: "Correct pronunciation, rules of tajweed, and confident recitation.",
        descAr: "تصحيح المخارج وأحكام التجويد وتلاوة واثقة.",
        bulletsEn: ["Makharij & sifat", "Rules practice", "Listening feedback", "Weekly targets"],
        bulletsAr: ["مخارج وصفات", "تطبيق الأحكام", "تصحيح بالاستماع", "أهداف أسبوعية"],
        accent: "bg-[#08ABD3]",
      },
      {
        titleEn: "Memorization (Hifz)",
        titleAr: "تحفيظ (حفظ)",
        descEn: "A structured memorization plan with revision and consistency.",
        descAr: "خطة حفظ منظمة مع مراجعة واستمرارية.",
        bulletsEn: ["Daily/weekly plan", "Revision schedule", "Retention techniques", "Progress tracking"],
        bulletsAr: ["خطة يومية/أسبوعية", "جدول مراجعة", "أساليب تثبيت", "متابعة التقدم"],
        accent: "bg-[#A2BF00]",
      },
      {
        titleEn: "Islamic Studies",
        titleAr: "مواد شرعية",
        descEn: "Age-appropriate Islamic knowledge with practical values.",
        descAr: "محتوى شرعي مناسب للعمر مع قيم عملية.",
        bulletsEn: ["Seerah & stories", "Fiqh basics", "Akhlaq & manners", "Short assessments"],
        bulletsAr: ["سيرة وقصص", "فقه مبسّط", "أخلاق وآداب", "تقييمات قصيرة"],
        accent: "bg-[#EB420E]",
      },
    ],
    []
  );

  const steps = useMemo(
    () => [
      {
        titleEn: "Quick assessment",
        titleAr: "تقييم سريع",
        bodyEn: "We identify the level in recitation / memorization / studies.",
        bodyAr: "نحدد المستوى في التلاوة/الحفظ/المواد الشرعية.",
        Icon: Target,
      },
      {
        titleEn: "Plan & goals",
        titleAr: "خطة وأهداف",
        bodyEn: "Clear weekly targets with simple home practice.",
        bodyAr: "أهداف أسبوعية واضحة مع تدريب منزلي بسيط.",
        Icon: BookOpen,
      },
      {
        titleEn: "Guided sessions",
        titleAr: "جلسات بإرشاد",
        bodyEn: "Live teacher guidance and correction, step by step.",
        bodyAr: "إرشاد مباشر وتصحيح تدريجي مع المدرس.",
        Icon: Users,
      },
      {
        titleEn: "Tracking & certificates",
        titleAr: "متابعة وشهادات",
        bodyEn: "Progress notes and milestones that parents can follow.",
        bodyAr: "ملاحظات تقدم ومحطات إنجاز يقدر ولي الأمر يتابعها.",
        Icon: GraduationCap,
      },
    ],
    []
  );

  return (
    <div className="bg-[#F18A68]" dir={isRTL ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-0">
        <div className="relative overflow-hidden rounded-[36px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.10)] ring-1 ring-black/5">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#08ABD3]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#A2BF00]/22 blur-3xl" />
          <div className="pointer-events-none absolute top-20 right-10 h-40 w-40 rounded-full bg-[#FDCF2F]/25 blur-2xl" />

          <div className="relative p-7 sm:p-10">
            <div className={`flex flex-wrap items-center gap-2 ${isRTL ? "justify-end" : ""}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#111624]/5 px-3 py-1 text-xs font-semibold text-[#111624]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#EB420E]" />
                {t(lang, "Quran & Islamic Studies", "قرآن ومواد شرعية")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#111624] ring-1 ring-black/5">
                <Sparkles className="h-4 w-4 text-[#EB420E]" />
                {t(lang, "Structured & gentle learning", "تعلم منظم وبأسلوب لطيف")}
              </span>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className={textAlign}>
                <h1 className="text-balance text-4xl font-black leading-tight text-[#111624] sm:text-5xl">
                  {t(
                    lang,
                    "Recitation, memorization, and Islamic knowledge — with clear goals.",
                    "تلاوة وحفظ ومعرفة شرعية — بأهداف واضحة."
                  )}
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#111624]/70">
                  {t(
                    lang,
                    "Choose the program, start with a quick assessment, and follow a weekly plan that builds confidence and consistency.",
                    "اختار البرنامج، ابدأ بتقييم سريع، واتبع خطة أسبوعية تبني الثقة والاستمرارية."
                  )}
                </p>

                <div className={`mt-8 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
                  <a
                    href="#programs"
                    className="inline-flex items-center gap-2 rounded-full bg-[#111624] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111624]/90"
                  >
                    {t(lang, "Explore programs", "استكشف البرامج")}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  </a>

                  <a
                    href={`/auth/register-parent?lang=${lang}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
                  >
                    {t(lang, "Join as Parent", "سجّل كولي أمر")}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  </a>

                  <a
                    href={`/?lang=${lang}#courses`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#111624]/10 px-6 py-3 text-sm font-semibold text-[#111624] transition hover:bg-[#111624]/15"
                  >
                    {t(lang, "Back to Home", "العودة للرئيسية")}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  </a>
                </div>
              </div>

              <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur">
                <div className={textAlign}>
                  <h3 className="text-lg font-extrabold text-[#111624]">
                    {t(lang, "A simple learning flow", "مسار تعلم بسيط")}
                  </h3>
                  <p className="mt-1 text-sm text-[#111624]/70">
                    {t(lang, "Focus on steady progress.", "تركيز على التقدم التدريجي.")}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {steps.map((s) => (
                    <FlowStep
                      key={s.titleEn}
                      isRTL={isRTL}
                      Icon={s.Icon}
                      title={t(lang, s.titleEn, s.titleAr)}
                      body={t(lang, s.bodyEn, s.bodyAr)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
          <div className={`mb-10 ${textAlign}`}>
            <h2 className="text-3xl font-bold text-[#111624]">
              {t(lang, "Programs", "البرامج")}
            </h2>
            <p className="mt-3 text-lg text-[#111624]/70">
              {t(
                lang,
                "Pick what your child needs now — we’ll adjust the pace and goals.",
                "اختار اللي ابنك محتاجه دلوقتي — وإحنا نضبط السرعة والأهداف."
              )}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {programs.map((p) => (
              <ProgramCard key={p.titleEn} lang={lang} isRTL={isRTL} p={p} />
            ))}
          </div>

          <div className={`mt-10 flex flex-wrap gap-4 ${isRTL ? "justify-end" : ""}`}>
            <a
              href={`/auth/register-parent?lang=${lang}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
            >
              {t(lang, "Start now", "ابدأ الآن")}
              <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
            </a>

            <a
              href={`/auth/register-teacher?lang=${lang}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#08ABD3] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0799c0]"
            >
              {t(lang, "Apply as teacher", "قدّم كمدرس")}
              <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small UI blocks                                                            */
/* -------------------------------------------------------------------------- */

function FlowStep({
  isRTL,
  Icon,
  title,
  body,
}: {
  isRTL: boolean;
  Icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111624]/5">
        <Icon className="h-4 w-4 text-[#111624]" />
      </div>
      <div className={isRTL ? "text-right" : "text-left"}>
        <p className="text-sm font-extrabold text-[#111624]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#111624]/70">{body}</p>
      </div>
    </div>
  );
}

function ProgramCard({
  lang,
  isRTL,
  p,
}: {
  lang: Lang;
  isRTL: boolean;
  p: {
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
    bulletsEn: string[];
    bulletsAr: string[];
    accent: string;
  };
}) {
  const title = t(lang, p.titleEn, p.titleAr);
  const desc = t(lang, p.descEn, p.descAr);
  const bullets = lang === "ar" ? p.bulletsAr : p.bulletsEn;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${p.accent}`}>
        <BookText className="h-4 w-4" />
        {t(lang, "Program", "برنامج")}
      </div>

      <h3 className={`mt-4 text-xl font-black text-[#111624] ${isRTL ? "text-right" : "text-left"}`}>
        {title}
      </h3>
      <p className={`mt-2 text-sm leading-relaxed text-[#111624]/70 ${isRTL ? "text-right" : "text-left"}`}>
        {desc}
      </p>

      <div className="mt-4 space-y-2">
        {bullets.map((b) => (
          <div key={b} className={`flex items-start gap-2 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#A2BF00]" />
            <span className="text-sm text-[#111624]/80">{b}</span>
          </div>
        ))}
      </div>

      <div className={`mt-6 flex ${isRTL ? "justify-end" : ""}`}>
        <a
          href={`/auth/register-parent?lang=${lang}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#111624] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111624]/90"
        >
          {t(lang, "Choose this", "اختار البرنامج")}
          <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
        </a>
      </div>
    </div>
  );
}

function QuranPageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export default function QuranPage() {
  return (
    <Suspense fallback={<QuranPageFallback />}>
      <QuranPageContent />
    </Suspense>
  );
}
