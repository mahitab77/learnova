// src/app/arabic/page.tsx
"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Languages,
  BookOpen,
  Headphones,
  Pencil,
  MessageCircle,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookText,
  Timer,
  Users,
} from "lucide-react";

type Lang = "en" | "ar";

function withLang(path: string, lang: Lang) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}

function AnchorLink({
  href,
  children,
  isRTL,
}: {
  href: string;
  children: React.ReactNode;
  isRTL: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 ${
        isRTL ? "flex-row-reverse" : ""
      }`}
    >
      {children}
    </a>
  );
}

function ArabicForNonNativePageContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";

  const t = useMemo(
    () => ({
      title:
        lang === "en"
          ? "Arabic for Non-Native Speakers"
          : "لغة عربية لغير الناطقين",
      subtitle:
        lang === "en"
          ? "Learn Arabic step-by-step — from letters to confident communication."
          : "تعلم العربية خطوة بخطوة — من الحروف حتى التواصل بثقة.",
      start: lang === "en" ? "Start Learning" : "ابدأ التعلم",
      level: lang === "en" ? "Check Your Level" : "حدد مستواك",
      note:
        lang === "en"
          ? "Note: This is Arabic learning for non-native speakers (not school curriculum Arabic)."
          : "ملاحظة: هذه عربية لغير الناطقين (ليست مادة عربي مناهج مدرسية).",
      quickNav: lang === "en" ? "Quick navigation" : "انتقال سريع",
      who: lang === "en" ? "Who is this for?" : "لمن هذه الصفحة؟",
      levels: lang === "en" ? "Levels" : "المستويات",
      skills: lang === "en" ? "What you will learn" : "ماذا ستتعلم؟",
      method: lang === "en" ? "Teaching approach" : "أسلوب التعلم",
      preview: lang === "en" ? "Lesson preview" : "نموذج درس",
      cert: lang === "en" ? "Progress & certificate" : "التقدم والشهادة",
      browse: lang === "en" ? "Browse teachers" : "تصفح المدرسين",
      ready:
        lang === "en"
          ? "Ready to start Arabic with confidence?"
          : "جاهز تبدأ العربية بثقة؟",
      readySub:
        lang === "en"
          ? "Choose a level, then pick a teacher that fits your schedule."
          : "اختار المستوى، ثم اختر المدرس المناسب لوقتك.",
      startA1:
        lang === "en" ? "Start as Beginner (A1)" : "ابدأ كمبتدئ (A1)",
      placement:
        lang === "en" ? "Take placement test" : "اختبار تحديد مستوى",
    }),
    [lang]
  );

  const forWho = useMemo(
    () => [
      {
        icon: <Users className="h-5 w-5 text-[#08ABD3]" />,
        en: "International / expat students",
        ar: "طلبة دوليين أو مقيمين",
      },
      {
        icon: <BookText className="h-5 w-5 text-[#A2BF00]" />,
        en: "Non-Arabic speakers in international schools",
        ar: "غير الناطقين بالعربية في المدارس الدولية",
      },
      {
        icon: <Sparkles className="h-5 w-5 text-[#FDCF2F]" />,
        en: "Beginners with zero background",
        ar: "مبتدئين تمامًا بدون خلفية",
      },
      {
        icon: <Languages className="h-5 w-5 text-[#08ABD3]" />,
        en: "Learners who want Modern Standard Arabic (MSA)",
        ar: "من يريد العربية الفصحى الحديثة",
      },
    ],
    []
  );

  const levels = useMemo(
    () => [
      { code: "A1", en: "Alphabet, sounds, basic words", ar: "الحروف والأصوات وكلمات أساسية" },
      { code: "A2", en: "Short sentences, daily topics", ar: "جُمل قصيرة وموضوعات يومية" },
      { code: "B1", en: "Reading short texts, basic grammar", ar: "قراءة نصوص قصيرة وقواعد بسيطة" },
      { code: "B2", en: "Longer conversations, better comprehension", ar: "محادثات أطول وفهم أفضل" },
      { code: "C1", en: "Formal Arabic, writing paragraphs", ar: "لغة رسمية وكتابة فقرات" },
    ],
    []
  );

  const learn = useMemo(
    () => [
      { icon: <Languages className="h-5 w-5" />, en: "Alphabet & pronunciation", ar: "الحروف والنطق" },
      { icon: <BookOpen className="h-5 w-5" />, en: "Reading & writing (RTL)", ar: "القراءة والكتابة (يمين-يسار)" },
      { icon: <Headphones className="h-5 w-5" />, en: "Listening practice", ar: "تدريب الاستماع" },
      { icon: <MessageCircle className="h-5 w-5" />, en: "Speaking from day one", ar: "محادثة من أول يوم" },
      { icon: <Pencil className="h-5 w-5" />, en: "Core grammar (light & practical)", ar: "قواعد أساسية (خفيفة وعملية)" },
    ],
    []
  );

  const approach = useMemo(
    () => [
      { en: "Pronunciation-first (sounds + practice)", ar: "النطق أولاً (أصوات + تطبيق)" },
      { en: "Short, consistent lessons (no overload)", ar: "دروس قصيرة ومنتظمة بدون ضغط" },
      { en: "Visual and contextual learning", ar: "تعلم بصري وسياقي" },
      { en: "Teacher feedback & simple quizzes", ar: "ملاحظات مدرس واختبارات بسيطة" },
    ],
    []
  );

  const [activeLevel, setActiveLevel] = useState<(typeof levels)[number]["code"]>("A1");

  const active = levels.find((x) => x.code === activeLevel) ?? levels[0];

  const arrowClass = `h-4 w-4 ${isRTL ? "rotate-180" : ""}`;

  return (
    <main dir={isRTL ? "rtl" : "ltr"} className="min-h-[calc(100dvh)] bg-slate-50">
      {/* ========================= HERO ========================= */}
      <section className="relative overflow-hidden">
        {/* gradient background */}
        <div className="absolute inset-0 bg-linear-to-b from-[#F18A68] via-[#F18A68]/70 to-slate-50" />

        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-20 left-10 h-56 w-56 rounded-full bg-[#A2BF00]/35 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-10 h-56 w-56 rounded-full bg-[#08ABD3]/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#FDCF2F]/25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-0">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            {/* left hero */}
            <div className={`${isRTL ? "text-right" : "text-left"}`}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                <Languages className="h-4 w-4 text-white" />
                {lang === "en" ? "Explore • Language" : "استكشف • لغات"}
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {t.title}
              </h1>

              <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
                {t.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={withLang("/courses", lang)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-[#8fa800]"
                >
                  {t.start}
                  <ArrowRight className={arrowClass} />
                </Link>

                <Link
                  href={withLang("/arabic?tab=placement", lang)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur transition-all hover:scale-[1.03] hover:bg-white/15"
                >
                  {t.level}
                  <ArrowRight className={arrowClass} />
                </Link>
              </div>

              <div className="mt-4 text-sm text-white/85">{t.note}</div>

              {/* quick nav */}
              <div className="mt-7">
                <div className="mb-3 text-xs font-semibold text-white/80">
                  {t.quickNav}
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnchorLink href="#overview" isRTL={isRTL}>
                    {lang === "en" ? "Overview" : "نظرة عامة"}
                  </AnchorLink>
                  <AnchorLink href="#levels" isRTL={isRTL}>
                    {t.levels}
                  </AnchorLink>
                  <AnchorLink href="#skills" isRTL={isRTL}>
                    {t.skills}
                  </AnchorLink>
                  <AnchorLink href="#method" isRTL={isRTL}>
                    {t.method}
                  </AnchorLink>
                  <AnchorLink href="#preview" isRTL={isRTL}>
                    {t.preview}
                  </AnchorLink>
                </div>
              </div>
            </div>

            {/* right hero visual */}
            <div className="relative">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className={`${isRTL ? "text-right" : "text-left"}`}>
                    <div className="text-sm font-semibold text-white/90">
                      {lang === "en" ? "Your learning path" : "مسارك التعليمي"}
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-white">
                      {lang === "en" ? "A1 → C1" : "A1 → C1"}
                    </div>
                    <div className="mt-2 text-sm text-white/85">
                      {lang === "en"
                        ? "Levels are designed for non-native learners."
                        : "المستويات مصممة خصيصًا لغير الناطقين."}
                    </div>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: <Timer className="h-4 w-4 text-[#FDCF2F]" />,
                      title: lang === "en" ? "Short lessons" : "دروس قصيرة",
                      sub: lang === "en" ? "Consistent pace" : "وتيرة ثابتة",
                    },
                    {
                      icon: <Headphones className="h-4 w-4 text-[#08ABD3]" />,
                      title: lang === "en" ? "Listening" : "استماع",
                      sub: lang === "en" ? "Pronunciation focus" : "تركيز على النطق",
                    },
                    {
                      icon: <MessageCircle className="h-4 w-4 text-[#A2BF00]" />,
                      title: lang === "en" ? "Speaking" : "محادثة",
                      sub: lang === "en" ? "From day one" : "من أول يوم",
                    },
                    {
                      icon: <BadgeCheck className="h-4 w-4 text-white" />,
                      title: lang === "en" ? "Certificate" : "شهادة",
                      sub: lang === "en" ? "Per level" : "لكل مستوى",
                    },
                  ].map((x, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-white/10 p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {x.icon}
                        <span>{x.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-white/80">{x.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* little floating badge */}
              <div className={`absolute -bottom-6 ${isRTL ? "left-6" : "right-6"}`}>
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#08ABD3]/10">
                    <Languages className="h-5 w-5 text-[#08ABD3]" />
                  </div>
                  <div className={`${isRTL ? "text-right" : "text-left"}`}>
                    <div className="text-sm font-bold text-[#111624]">
                      {lang === "en" ? "MSA Focus" : "تركيز على الفصحى"}
                    </div>
                    <div className="text-xs text-[#111624]/60">
                      {lang === "en" ? "Modern Standard Arabic" : "العربية الفصحى الحديثة"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end right */}
          </div>
        </div>
      </section>

      {/* ========================= OVERVIEW ========================= */}
      <section id="overview" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className={`flex items-start justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`${isRTL ? "text-right" : "text-left"}`}>
                <h2 className="text-xl font-extrabold text-[#111624]">
                  {t.who}
                </h2>
                <p className="mt-2 text-sm text-[#111624]/60">
                  {lang === "en"
                    ? "Designed for learners who want Arabic as a language (not a school curriculum subject)."
                    : "مصممة للمتعلمين اللي عايزين العربية كلغة (مش مادة عربي مناهج)."}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F18A68]/10">
                <Sparkles className="h-6 w-6 text-[#F18A68]" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {forWho.map((x, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-3 rounded-2xl border border-[#111624]/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#08ABD3]/40 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5">
                    {x.icon}
                  </div>
                  <div className={`${isRTL ? "text-right" : "text-left"} min-w-0`}>
                    <div className="text-sm font-bold text-[#111624]">
                      {lang === "en" ? x.en : x.ar}
                    </div>
                    <div className="mt-1 text-xs text-[#111624]/60">
                      {lang === "en"
                        ? "Good fit for structured progress."
                        : "مناسب للتقدم المنظم."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress & certificate */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-[#111624]">{t.cert}</h3>

            <div className="mt-4 space-y-3">
              {[
                {
                  icon: <BadgeCheck className="h-5 w-5 text-[#A2BF00]" />,
                  text: lang === "en" ? "Track your level progress" : "تتبع تقدمك في المستوى",
                },
                {
                  icon: <BadgeCheck className="h-5 w-5 text-[#08ABD3]" />,
                  text: lang === "en" ? "Certificate per completed level" : "شهادة عند إكمال كل مستوى",
                },
                {
                  icon: <BadgeCheck className="h-5 w-5 text-[#FDCF2F]" />,
                  text: lang === "en" ? "Teacher feedback & simple assessments" : "ملاحظات مدرس وتقييمات بسيطة",
                },
              ].map((x, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl bg-[#F8F9FA] p-4"
                >
                  {x.icon}
                  <div className="text-sm text-[#111624]/70">{x.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link
                href={withLang("/courses", lang)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#08ABD3] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.01]"
              >
                {t.browse}
                <ArrowRight className={arrowClass} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= LEVELS ========================= */}
      <section id="levels" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-0">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className={`flex items-center justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`${isRTL ? "text-right" : "text-left"}`}>
              <h2 className="text-xl font-extrabold text-[#111624]">{t.levels}</h2>
              <p className="mt-2 text-sm text-[#111624]/60">
                {lang === "en"
                  ? "Pick the level that matches you — you can start from A1 if you’re new."
                  : "اختار المستوى المناسب — ولو جديد ابدأ من A1."}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A2BF00]/10">
              <BadgeCheck className="h-6 w-6 text-[#A2BF00]" />
            </div>
          </div>

          {/* timeline selector */}
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="relative mt-2">
                <div className="absolute left-0 right-0 top-6 h-1 rounded-full bg-[#111624]/10" />
                <div className="relative grid grid-cols-5 gap-2">
                  {levels.map((lv) => {
                    const isActive = lv.code === activeLevel;
                    return (
                      <button
                        key={lv.code}
                        type="button"
                        onClick={() => setActiveLevel(lv.code)}
                        className={`group flex flex-col items-center gap-2 rounded-2xl px-2 py-2 transition-all ${
                          isActive ? "scale-[1.01]" : "hover:scale-[1.01]"
                        }`}
                        aria-pressed={isActive}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-extrabold transition-all ${
                            isActive
                              ? "border-[#08ABD3]/40 bg-[#08ABD3]/10 text-[#111624] shadow-sm"
                              : "border-[#111624]/10 bg-white text-[#111624]"
                          }`}
                        >
                          {lv.code}
                        </div>
                        <div className="text-xs font-semibold text-[#111624]/70">
                          {lang === "en" ? `Level ${lv.code}` : `المستوى ${lv.code}`}
                        </div>
                        <div className={`h-2 w-2 rounded-full ${isActive ? "bg-[#08ABD3]" : "bg-[#111624]/20"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* active detail */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#111624]/10 bg-[#F8F9FA] p-6 lg:col-span-2">
              <div className={`flex items-start justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="text-sm font-semibold text-[#111624]/60">
                    {lang === "en" ? "Selected level" : "المستوى المختار"}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-[#111624]">
                    {active.code}
                  </div>
                  <div className="mt-2 text-sm text-[#111624]/70">
                    {lang === "en" ? active.en : active.ar}
                  </div>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-[#A2BF00]" />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  lang === "en" ? "Speaking" : "محادثة",
                  lang === "en" ? "Listening" : "استماع",
                  lang === "en" ? "Reading" : "قراءة",
                  lang === "en" ? "Writing" : "كتابة",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#111624]/10 bg-white px-3 py-1 text-xs font-semibold text-[#111624]/70"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#111624] p-6 text-white shadow-sm">
              <div className={`flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="text-sm font-semibold text-white/80">
                    {lang === "en" ? "Next step" : "الخطوة القادمة"}
                  </div>
                  <div className="mt-1 text-lg font-extrabold">
                    {lang === "en" ? "Pick a teacher" : "اختر مدرس"}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="mt-4 text-sm text-white/80">
                {lang === "en"
                  ? "Browse Arabic teachers and start your first session."
                  : "تصفح مدرسين العربي وابدأ أول حصة."}
              </div>

              <Link
                href={withLang("/courses", lang)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A2BF00] px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#8fa800]"
              >
                {t.browse}
                <ArrowRight className={arrowClass} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= SKILLS ========================= */}
      <section id="skills" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className={`flex items-center justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`${isRTL ? "text-right" : "text-left"}`}>
                <h2 className="text-xl font-extrabold text-[#111624]">{t.skills}</h2>
                <p className="mt-2 text-sm text-[#111624]/60">
                  {lang === "en"
                    ? "A balanced mix: listening, speaking, reading, and writing."
                    : "مزيج متوازن: استماع، محادثة، قراءة، وكتابة."}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08ABD3]/10">
                <Sparkles className="h-6 w-6 text-[#08ABD3]" />
              </div>
            </div>

            {/* feature chips (not cards) */}
            <div className="mt-6 flex flex-wrap gap-3">
              {learn.map((x, i) => (
                <div
                  key={i}
                  className="group inline-flex items-center gap-3 rounded-full border border-[#111624]/10 bg-white px-4 py-3 text-sm font-semibold text-[#111624] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#A2BF00]/40 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-[#111624]">
                    {x.icon}
                  </span>
                  <span className="whitespace-nowrap">
                    {lang === "en" ? x.en : x.ar}
                  </span>
                </div>
              ))}
            </div>

            {/* mini reassurance */}
            <div className="mt-6 rounded-2xl bg-[#F8F9FA] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-[#A2BF00]" />
                </div>
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="text-sm font-extrabold text-[#111624]">
                    {lang === "en"
                      ? "No memorization overload"
                      : "بدون ضغط حفظ"}
                  </div>
                  <div className="mt-1 text-sm text-[#111624]/60">
                    {lang === "en"
                      ? "We keep it practical and repeated through real examples."
                      : "بنخليها عملية وبالتكرار من خلال أمثلة واقعية."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* side CTA */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className={`${isRTL ? "text-right" : "text-left"}`}>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FDCF2F]/20 px-4 py-2 text-xs font-bold text-[#111624]">
                <Timer className="h-4 w-4 text-[#111624]" />
                {lang === "en" ? "Start in minutes" : "ابدأ خلال دقائق"}
              </div>

              <h3 className="mt-4 text-lg font-extrabold text-[#111624]">
                {lang === "en"
                  ? "Match your schedule"
                  : "اختار وقتك"}
              </h3>

              <p className="mt-2 text-sm text-[#111624]/60">
                {lang === "en"
                  ? "Pick a teacher based on availability and level."
                  : "اختار المدرس حسب المواعيد والمستوى."}
              </p>

              <div className="mt-5 space-y-2">
                <Link
                  href={withLang("/courses", lang)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#08ABD3] px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
                >
                  {t.browse}
                  <ArrowRight className={arrowClass} />
                </Link>

                <Link
                  href={withLang("/arabic?tab=placement", lang)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#111624]/10 bg-white px-5 py-3 text-sm font-semibold text-[#111624] transition-all hover:scale-[1.01]"
                >
                  {t.placement}
                  <ArrowRight className={arrowClass} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= METHOD ========================= */}
      <section id="method" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-0">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className={`flex items-center justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`${isRTL ? "text-right" : "text-left"}`}>
              <h2 className="text-xl font-extrabold text-[#111624]">{t.method}</h2>
              <p className="mt-2 text-sm text-[#111624]/60">
                {lang === "en"
                  ? "A simple method that keeps you progressing without stress."
                  : "أسلوب بسيط يضمن تقدمك بدون توتر."}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A2BF00]/10">
              <Sparkles className="h-6 w-6 text-[#A2BF00]" />
            </div>
          </div>

          {/* vertical timeline */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="relative rounded-3xl bg-[#F8F9FA] p-6">
              <div className="absolute inset-y-6 left-7 w-1 rounded-full bg-[#111624]/10" />
              <div className="space-y-5">
                {approach.map((x, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <span className="text-sm font-extrabold text-[#111624]">{i + 1}</span>
                    </div>
                    <div className={`${isRTL ? "text-right" : "text-left"} pt-1`}>
                      <div className="text-sm font-bold text-[#111624]">
                        {lang === "en" ? x.en : x.ar}
                      </div>
                      <div className="mt-1 text-xs text-[#111624]/60">
                        {lang === "en"
                          ? "Practical examples + repetition."
                          : "أمثلة عملية + تكرار."}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#111624]/10 p-6">
              <div className={`${isRTL ? "text-right" : "text-left"}`}>
                <div className="text-sm font-semibold text-[#111624]/60">
                  {lang === "en" ? "What a lesson usually includes" : "الدرس غالبًا بيكون فيه"}
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      icon: <Headphones className="h-5 w-5 text-[#08ABD3]" />,
                      title: lang === "en" ? "Listen & repeat" : "اسمع وكرر",
                      sub: lang === "en" ? "Sounds and pronunciation" : "أصوات ونطق",
                    },
                    {
                      icon: <Pencil className="h-5 w-5 text-[#A2BF00]" />,
                      title: lang === "en" ? "Write & practice" : "اكتب وطبّق",
                      sub: lang === "en" ? "Guided writing strokes" : "تدريب كتابة موجه",
                    },
                    {
                      icon: <MessageCircle className="h-5 w-5 text-[#FDCF2F]" />,
                      title: lang === "en" ? "Speak in context" : "اتكلم في سياق",
                      sub: lang === "en" ? "Daily conversation" : "محادثة يومية",
                    },
                  ].map((x, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-2xl bg-[#F8F9FA] p-4"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                        {x.icon}
                      </div>
                      <div className={`${isRTL ? "text-right" : "text-left"}`}>
                        <div className="text-sm font-extrabold text-[#111624]">
                          {x.title}
                        </div>
                        <div className="mt-1 text-xs text-[#111624]/60">
                          {x.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <Link
                    href={withLang("/courses", lang)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A2BF00] px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#8fa800]"
                  >
                    {t.start}
                    <ArrowRight className={arrowClass} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= PREVIEW ========================= */}
      <section id="preview" className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 lg:px-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* lesson preview "player" */}
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className={`flex items-start justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`${isRTL ? "text-right" : "text-left"}`}>
                <h2 className="text-xl font-extrabold text-[#111624]">{t.preview}</h2>
                <p className="mt-2 text-sm text-[#111624]/60">
                  {lang === "en"
                    ? "Here’s how a first lesson can look."
                    : "ده شكل أول درس ممكن يكون عامل إزاي."}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08ABD3]/10">
                <BookOpen className="h-6 w-6 text-[#08ABD3]" />
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[#111624]/10 bg-[#F8F9FA] p-6">
              <div className={`flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="text-sm font-semibold text-[#111624]/60">
                    {lang === "en" ? "Lesson 1" : "الدرس 1"}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-[#111624]">
                    {lang === "en" ? "Letters & Greetings" : "حروف + تحية"}
                  </div>
                </div>

                <div className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#111624] shadow-sm">
                  {lang === "en" ? "A1" : "A1"}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    title: lang === "en" ? "Letters" : "الحروف",
                    value: lang === "en" ? "أ ب ت" : "أ ب ت",
                  },
                  {
                    title: lang === "en" ? "Pronunciation" : "النطق",
                    value: lang === "en" ? "Sounds + repeat" : "أصوات + تكرار",
                  },
                  {
                    title: lang === "en" ? "Writing" : "الكتابة",
                    value: lang === "en" ? "Guided strokes" : "تدريب كتابة",
                  },
                  {
                    title: lang === "en" ? "Greetings" : "التحية",
                    value: lang === "en" ? "Hello / Goodbye" : "أهلاً / مع السلامة",
                  },
                ].map((x, i) => (
                  <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-xs font-semibold text-[#111624]/60">
                      {x.title}
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-[#111624]">
                      {x.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  lang === "en" ? "Repeat" : "تكرار",
                  lang === "en" ? "Practice" : "تطبيق",
                  lang === "en" ? "Speak" : "محادثة",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#111624]/10 bg-white px-3 py-1 text-xs font-semibold text-[#111624]/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={withLang("/courses", lang)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#08ABD3] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02]"
                >
                  {t.browse}
                  <ArrowRight className={arrowClass} />
                </Link>
                <Link
                  href={withLang("/arabic?tab=placement", lang)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#111624]/10 bg-white px-5 py-3 text-sm font-semibold text-[#111624] shadow-sm transition-all hover:scale-[1.02]"
                >
                  {t.placement}
                  <ArrowRight className={arrowClass} />
                </Link>
              </div>
            </div>
          </div>

          {/* final CTA */}
          <div className="rounded-3xl bg-[#111624] p-6 text-white shadow-sm">
            <div className={`${isRTL ? "text-right" : "text-left"}`}>
              <h3 className="text-xl font-extrabold">{t.ready}</h3>
              <p className="mt-2 text-sm text-white/80">{t.readySub}</p>

              <div className="mt-5 space-y-2">
                <Link
                  href={withLang("/courses", lang)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#8fa800]"
                >
                  {t.startA1}
                  <ArrowRight className={arrowClass} />
                </Link>

                <Link
                  href={withLang("/arabic?tab=placement", lang)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
                >
                  {t.placement}
                  <ArrowRight className={arrowClass} />
                </Link>
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#FDCF2F]" />
                  <div className="text-sm text-white/85">
                    {lang === "en"
                      ? "If you’re not sure, take the placement test — it’s quick."
                      : "لو مش متأكد، اعمل اختبار تحديد المستوى — سريع وبسيط."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ArabicForNonNativePageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export default function ArabicForNonNativePage() {
  return (
    <Suspense fallback={<ArabicForNonNativePageFallback />}>
      <ArabicForNonNativePageContent />
    </Suspense>
  );
}
