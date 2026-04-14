// src/app/arts/page.tsx
"use client";

/**
 * Arts & Skills — فنون ومهارات
 * -----------------------------------------------------------------------------
 * Includes:
 * - Drawing
 * - Music
 * - Handmade
 * - Tailoring
 * You can expand later with photography, design, etc.
 */

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Music,
  Palette,
  Scissors,
  Sparkles,
  Target,
  Users,
  Wrench,
} from "lucide-react";

type Lang = "en" | "ar";
function t(lang: Lang, en: string, ar: string) {
  return lang === "ar" ? ar : en;
}

type Track = {
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  bulletsEn: string[];
  bulletsAr: string[];
  accent: string;
  Icon: React.ElementType;
};

function ArtsPageContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";
  const textAlign = isRTL ? "text-right" : "text-left";

  const tracks = useMemo<Track[]>(
    () => [
      {
        titleEn: "Drawing & Art",
        titleAr: "رسم وفنون",
        descEn: "Foundations, styles, and building confidence through practice.",
        descAr: "تأسيس وأساليب وبناء ثقة عبر التدريب.",
        bulletsEn: ["Basics & shading", "Characters & composition", "Weekly art tasks", "Portfolio pieces"],
        bulletsAr: ["أساسيات وتظليل", "شخصيات وتكوين", "مهام أسبوعية", "أعمال بورتفوليو"],
        accent: "bg-[#08ABD3]",
        Icon: Palette,
      },
      {
        titleEn: "Music",
        titleAr: "ميوزيك",
        descEn: "Rhythm, practice routines, and step-by-step progress.",
        descAr: "إيقاع وروتين تدريب وتقدم تدريجي.",
        bulletsEn: ["Rhythm & ear training", "Practice plan", "Songs & performance", "Confidence building"],
        bulletsAr: ["إيقاع وتمييز سمعي", "خطة تدريب", "أغاني وأداء", "بناء ثقة"],
        accent: "bg-[#A2BF00]",
        Icon: Music,
      },
      {
        titleEn: "Handmade & Crafts",
        titleAr: "أعمال يدوية",
        descEn: "Fun practical skills that improve creativity and focus.",
        descAr: "مهارات عملية ممتعة تنمي الإبداع والتركيز.",
        bulletsEn: ["Safe tools & basics", "Projects each month", "Creativity challenges", "Showcase outcomes"],
        bulletsAr: ["أدوات آمنة وتأسيس", "مشاريع شهرية", "تحديات إبداع", "نتائج قابلة للعرض"],
        accent: "bg-[#FDCF2F]",
        Icon: Wrench,
      },
      {
        titleEn: "Tailoring",
        titleAr: "تفصيل",
        descEn: "Basics of stitching, patterns, and building real products.",
        descAr: "أساسيات خياطة وباترونات وبناء منتجات فعلية.",
        bulletsEn: ["Stitching basics", "Simple patterns", "Finishing & quality", "Practical projects"],
        bulletsAr: ["أساسيات الخياطة", "باترونات بسيطة", "تشطيب وجودة", "مشاريع عملية"],
        accent: "bg-[#EB420E]",
        Icon: Scissors,
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
                {t(lang, "Arts & Skills", "فنون ومهارات")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#111624] ring-1 ring-black/5">
                <Sparkles className="h-4 w-4 text-[#EB420E]" />
                {t(lang, "Build confidence through making", "ثقة أعلى من خلال التنفيذ")}
              </span>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className={textAlign}>
                <h1 className="text-balance text-4xl font-black leading-tight text-[#111624] sm:text-5xl">
                  {t(lang, "Creative skills that kids actually enjoy.", "مهارات إبداعية الأطفال بيحبوها فعلًا.")}
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#111624]/70">
                  {t(
                    lang,
                    "Every track is practical: short lessons, guided practice, and outcomes you can see.",
                    "كل مسار عملي: دروس قصيرة، تدريب بإرشاد، ونتائج واضحة."
                  )}
                </p>

                <div className={`mt-8 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
                  <a
                    href="#tracks"
                    className="inline-flex items-center gap-2 rounded-full bg-[#111624] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111624]/90"
                  >
                    {t(lang, "Explore tracks", "استكشف المسارات")}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                  </a>
                  <a
                    href={`/auth/register-parent?lang=${lang}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
                  >
                    {t(lang, "Start now", "ابدأ الآن")}
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
                    {t(lang, "How it works", "كيف يعمل")}
                  </h3>
                </div>

                <div className="mt-4 space-y-3">
                  <Step
                    isRTL={isRTL}
                    Icon={Target}
                    title={t(lang, "Pick a track", "اختار المسار")}
                    body={t(lang, "Based on interest: art, music, handmade, tailoring.", "حسب الاهتمام: رسم، ميوزيك، أعمال يدوية، تفصيل.")}
                  />
                  <Step
                    isRTL={isRTL}
                    Icon={Users}
                    title={t(lang, "Guided practice", "تدريب بإرشاد")}
                    body={t(lang, "Live sessions with step-by-step guidance.", "جلسات مباشرة مع توجيه خطوة بخطوة.")}
                  />
                  <Step
                    isRTL={isRTL}
                    Icon={CheckCircle2}
                    title={t(lang, "Show outcomes", "اعرض النتائج")}
                    body={t(lang, "Every month: a project you can share.", "كل شهر: مشروع قابل للعرض والمشاركة.")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section id="tracks" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
          <div className={`mb-10 ${textAlign}`}>
            <h2 className="text-3xl font-bold text-[#111624]">
              {t(lang, "Tracks", "المسارات")}
            </h2>
            <p className="mt-3 text-lg text-[#111624]/70">
              {t(lang, "Choose what your child loves — and build skills from there.", "اختار اللي ابنك بيحبه — وابدأ تبني المهارة.")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {tracks.map((trk) => (
              <TrackCard key={trk.titleEn} lang={lang} isRTL={isRTL} trk={trk} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
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

function TrackCard({
  lang,
  isRTL,
  trk,
}: {
  lang: Lang;
  isRTL: boolean;
  trk: {
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
    bulletsEn: string[];
    bulletsAr: string[];
    accent: string;
    Icon: React.ElementType;
  };
}) {
  const title = t(lang, trk.titleEn, trk.titleAr);
  const desc = t(lang, trk.descEn, trk.descAr);
  const bullets = lang === "ar" ? trk.bulletsAr : trk.bulletsEn;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${trk.accent}`}>
        <trk.Icon className="h-4 w-4" />
        {t(lang, "Track", "مسار")}
      </div>

      <h3 className={`mt-4 text-xl font-black text-[#111624] ${isRTL ? "text-right" : "text-left"}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed text-[#111624]/70 ${isRTL ? "text-right" : "text-left"}`}>{desc}</p>

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
          {t(lang, "Start", "ابدأ")}
          <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
        </a>
      </div>
    </div>
  );
}

function ArtsPageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export default function ArtsPage() {
  return (
    <Suspense fallback={<ArtsPageFallback />}>
      <ArtsPageContent />
    </Suspense>
  );
}
