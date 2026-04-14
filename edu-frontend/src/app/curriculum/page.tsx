// src/app/curriculum/page.tsx
"use client";

/**
 * Curriculum Page — تعليم ومناهج دراسية
 * -----------------------------------------------------------------------------
 * ✅ This page is the old "/courses" page moved to "/curriculum"
 * ✅ Copy tuned to be clearly "Curriculum / School Subjects"
 * ✅ Still supports bilingual EN/AR and RTL/LTR
 * ✅ No setState-in-effect pattern (safe with eslint react-hooks rules)
 */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  Code2,
  Cpu,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  Languages,
  Palette,
  Sparkles,
  Target,
  Users,
} from "lucide-react";



type SystemKey = "egyptian" | "american" | "british" | "ib";
type StageKey = "kg" | "primary" | "prep" | "secondary";

type Stage = {
  key: StageKey;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  levels: Level[];
};

type EduSystem = {
  key: SystemKey;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  accent: string; // e.g. "bg-[#A2BF00]"
  stages: Stage[];
};

function t(lang: Lang, en: string, ar: string) {
  return lang === "ar" ? ar : en;
}

function CurriculumPageContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";
  const textAlign = isRTL ? "text-right" : "text-left";

  const systems = useMemo<EduSystem[]>(() => {
    const corePrimary: Chip[] = [
      { Icon: Languages, en: "English", ar: "English" },
      { Icon: Languages, en: "Arabic", ar: "العربية" },
      { Icon: Calculator, en: "Math", ar: "الرياضيات" },
      { Icon: FlaskConical, en: "Science", ar: "العلوم" },
    ];

    const corePrep: Chip[] = [
      { Icon: Languages, en: "English", ar: "English" },
      { Icon: Languages, en: "Arabic", ar: "العربية" },
      { Icon: Calculator, en: "Math", ar: "الرياضيات" },
      { Icon: FlaskConical, en: "Science", ar: "العلوم" },
      { Icon: BookOpen, en: "Social Studies", ar: "الدراسات" },
    ];

    const coreSecondary: Chip[] = [
      { Icon: Calculator, en: "Math", ar: "الرياضيات" },
      { Icon: FlaskConical, en: "Physics/Chemistry", ar: "فيزياء/كيمياء" },
      { Icon: FlaskConical, en: "Biology", ar: "أحياء" },
      { Icon: Languages, en: "English Skills", ar: "مهارات اللغة الإنجليزية" },
    ];

    // Enrichment (complements curriculum)
    const enrichmentStarter: Chip[] = [
      { Icon: Code2, en: "Creative Coding", ar: "البرمجة الإبداعية" },
      { Icon: Palette, en: "Digital Arts", ar: "الفنون الرقمية" },
      { Icon: Gamepad2, en: "Game Basics", ar: "أساسيات الألعاب" },
    ];

    const enrichmentBuilder: Chip[] = [
      { Icon: Code2, en: "Apps & Web", ar: "تطبيقات وويب" },
      { Icon: Gamepad2, en: "Game Development", ar: "تطوير الألعاب" },
      { Icon: Cpu, en: "Robotics & AI", ar: "الروبوتات وAI" },
    ];

    const enrichmentAdvanced: Chip[] = [
      { Icon: Code2, en: "Portfolio Projects", ar: "مشاريع بورتفوليو" },
      { Icon: Cpu, en: "AI Projects", ar: "مشاريع ذكاء اصطناعي" },
      { Icon: Sparkles, en: "Capstone Lab", ar: "مشروع تخرّج" },
    ];

    const egyptian: EduSystem = {
      key: "egyptian",
      titleEn: "Egyptian National",
      titleAr: "المنهج المصري",
      descEn: "Organized by stage and grade with clear outcomes.",
      descAr: "منظم حسب المرحلة والصف مع مخرجات واضحة.",
      accent: "bg-[#A2BF00]",
      stages: [
        {
          key: "kg",
          titleEn: "Kindergarten",
          titleAr: "KG",
          descEn: "Foundations: language, logic, creativity, confidence.",
          descAr: "أساسيات: لغة، منطق، إبداع، وثقة.",
          levels: [
            {
              id: "egy-kg",
              titleEn: "KG (1–2)",
              titleAr: "KG (1–2)",
              gradesEn: "KG1–KG2",
              gradesAr: "KG1–KG2",
              ageEn: "Ages 4–6",
              ageAr: "الأعمار ٤–٦",
              coreSubjects: [
                { Icon: Languages, en: "Arabic readiness", ar: "تمهيد عربي" },
                { Icon: Languages, en: "English readiness", ar: "تمهيد إنجليزي" },
                { Icon: Calculator, en: "Numbers & patterns", ar: "أرقام وأنماط" },
              ],
              enrichmentCourses: enrichmentStarter,
              highlightEn: "Play-based learning + gentle academic routine.",
              highlightAr: "تعلم ممتع + روتين دراسي خفيف.",
            },
          ],
        },
        {
          key: "primary",
          titleEn: "Primary",
          titleAr: "الابتدائي",
          descEn: "Core skills + practice that makes learning stick.",
          descAr: "مهارات أساسية + تدريب يثبت التعلم.",
          levels: [
            {
              id: "egy-p-lower",
              titleEn: "Primary (Lower)",
              titleAr: "ابتدائي (1–3)",
              gradesEn: "Primary 1–3",
              gradesAr: "1–3 ابتدائي",
              ageEn: "Ages 6–9",
              ageAr: "الأعمار ٦–٩",
              coreSubjects: corePrimary,
              enrichmentCourses: enrichmentStarter,
              highlightEn: "Weekly practice + confident exam readiness.",
              highlightAr: "تدريب أسبوعي + جاهزية للامتحانات بثقة.",
            },
            {
              id: "egy-p-upper",
              titleEn: "Primary (Upper)",
              titleAr: "ابتدائي (4–6)",
              gradesEn: "Primary 4–6",
              gradesAr: "4–6 ابتدائي",
              ageEn: "Ages 9–12",
              ageAr: "الأعمار ٩–١٢",
              coreSubjects: [
                ...corePrimary,
                { Icon: Brain, en: "Critical thinking", ar: "تفكير ناقد" },
              ],
              enrichmentCourses: enrichmentBuilder,
              highlightEn: "Stronger comprehension + structured problem-solving.",
              highlightAr: "فهم أعمق + حل مسائل بشكل منظم.",
            },
          ],
        },
        {
          key: "prep",
          titleEn: "Preparatory",
          titleAr: "الإعدادي",
          descEn: "Stronger academics + structured revision plans.",
          descAr: "أكاديمية أقوى + خطط مراجعة منظمة.",
          levels: [
            {
              id: "egy-prep",
              titleEn: "Preparatory (1–3)",
              titleAr: "إعدادي (1–3)",
              gradesEn: "Prep 1–3",
              gradesAr: "1–3 إعدادي",
              ageEn: "Ages 12–15",
              ageAr: "الأعمار ١٢–١٥",
              coreSubjects: corePrep,
              enrichmentCourses: enrichmentBuilder,
              highlightEn: "Clear milestones, frequent quizzes, real progress.",
              highlightAr: "مراحل واضحة، اختبارات دورية، تقدم حقيقي.",
            },
          ],
        },
        {
          key: "secondary",
          titleEn: "Secondary",
          titleAr: "الثانوي",
          descEn: "Exam readiness + specialization + mastery practice.",
          descAr: "جاهزية الامتحانات + تخصص + تدريب مكثف.",
          levels: [
            {
              id: "egy-sec",
              titleEn: "Secondary (1–3)",
              titleAr: "ثانوي (1–3)",
              gradesEn: "Sec 1–3",
              gradesAr: "1–3 ثانوي",
              ageEn: "Ages 15–18",
              ageAr: "الأعمار ١٥–١٨",
              coreSubjects: coreSecondary,
              enrichmentCourses: enrichmentAdvanced,
              highlightEn: "Advanced revision + high-impact outcomes.",
              highlightAr: "مراجعة متقدمة + نتائج قوية.",
            },
          ],
        },
      ],
    };

    const american: EduSystem = {
      key: "american",
      titleEn: "American System",
      titleAr: "النظام الأمريكي",
      descEn: "Skill-based progression across grade bands.",
      descAr: "تدرج قائم على المهارات عبر المراحل.",
      accent: "bg-[#08ABD3]",
      stages: [
        {
          key: "primary",
          titleEn: "Elementary",
          titleAr: "Elementary",
          descEn: "Reading, writing, and math fluency + creativity.",
          descAr: "طلاقة في القراءة والكتابة والرياضيات + إبداع.",
          levels: [
            {
              id: "us-elem",
              titleEn: "Elementary",
              titleAr: "Elementary",
              gradesEn: "Grades 1–5",
              gradesAr: "Grades 1–5",
              ageEn: "Ages 6–11",
              ageAr: "الأعمار ٦–١١",
              coreSubjects: [
                { Icon: Languages, en: "English (ELA)", ar: "English (ELA)" },
                { Icon: Calculator, en: "Math", ar: "Math" },
                { Icon: FlaskConical, en: "Science", ar: "Science" },
                { Icon: BookOpen, en: "Social Studies", ar: "Social Studies" },
              ],
              enrichmentCourses: enrichmentStarter,
              highlightEn: "Practice that builds confidence and consistency.",
              highlightAr: "تدريب يبني الثقة والاستمرارية.",
            },
          ],
        },
        {
          key: "prep",
          titleEn: "Middle School",
          titleAr: "Middle School",
          descEn: "Deeper logic, writing, and structured builds.",
          descAr: "منطق وكتابة أقوى وتدريب منظم.",
          levels: [
            {
              id: "us-middle",
              titleEn: "Middle School",
              titleAr: "Middle School",
              gradesEn: "Grades 6–8",
              gradesAr: "Grades 6–8",
              ageEn: "Ages 11–14",
              ageAr: "الأعمار ١١–١٤",
              coreSubjects: corePrep,
              enrichmentCourses: enrichmentBuilder,
              highlightEn: "Visible progress + strong study habits.",
              highlightAr: "تقدم واضح + عادات مذاكرة قوية.",
            },
          ],
        },
        {
          key: "secondary",
          titleEn: "High School",
          titleAr: "High School",
          descEn: "Advanced practice + portfolio outcomes.",
          descAr: "تدريب متقدم + مخرجات قوية.",
          levels: [
            {
              id: "us-high",
              titleEn: "High School",
              titleAr: "High School",
              gradesEn: "Grades 9–12",
              gradesAr: "Grades 9–12",
              ageEn: "Ages 14–18",
              ageAr: "الأعمار ١٤–١٨",
              coreSubjects: coreSecondary,
              enrichmentCourses: enrichmentAdvanced,
              highlightEn: "Strong outcomes aligned with university readiness.",
              highlightAr: "نتائج قوية تتماشى مع جاهزية الجامعة.",
            },
          ],
        },
      ],
    };

    const british: EduSystem = {
      key: "british",
      titleEn: "British (UK / IGCSE)",
      titleAr: "البريطاني (IGCSE)",
      descEn: "Key Stages → IGCSE → A-Levels progression.",
      descAr: "تدرج Key Stages → IGCSE → A-Levels.",
      accent: "bg-[#EB420E]",
      stages: [
        {
          key: "primary",
          titleEn: "Primary (KS1–KS2)",
          titleAr: "Primary (KS1–KS2)",
          descEn: "Strong foundations and learning habits.",
          descAr: "تأسيس قوي وعادات تعلم جيدة.",
          levels: [
            {
              id: "uk-ks1",
              titleEn: "Key Stage 1",
              titleAr: "Key Stage 1",
              gradesEn: "Year 1–2",
              gradesAr: "Year 1–2",
              ageEn: "Ages 5–7",
              ageAr: "الأعمار ٥–٧",
              coreSubjects: [
                { Icon: Languages, en: "English", ar: "English" },
                { Icon: Calculator, en: "Maths", ar: "Maths" },
                { Icon: FlaskConical, en: "Science", ar: "Science" },
              ],
              enrichmentCourses: enrichmentStarter,
              highlightEn: "Short, engaging sessions with weekly outcomes.",
              highlightAr: "جلسات قصيرة ممتعة مع نتائج أسبوعية.",
            },
            {
              id: "uk-ks2",
              titleEn: "Key Stage 2",
              titleAr: "Key Stage 2",
              gradesEn: "Year 3–6",
              gradesAr: "Year 3–6",
              ageEn: "Ages 7–11",
              ageAr: "الأعمار ٧–١١",
              coreSubjects: [
                { Icon: Languages, en: "English", ar: "English" },
                { Icon: Calculator, en: "Maths", ar: "Maths" },
                { Icon: FlaskConical, en: "Science", ar: "Science" },
                { Icon: BookOpen, en: "Humanities", ar: "Humanities" },
              ],
              enrichmentCourses: enrichmentBuilder,
              highlightEn: "From basics → structured building blocks.",
              highlightAr: "من الأساسيات → بناء منظم.",
            },
          ],
        },
        {
          key: "prep",
          titleEn: "KS3",
          titleAr: "KS3",
          descEn: "Deeper concepts + revision structure.",
          descAr: "مفاهيم أعمق + تنظيم للمراجعة.",
          levels: [
            {
              id: "uk-ks3",
              titleEn: "Key Stage 3",
              titleAr: "Key Stage 3",
              gradesEn: "Year 7–9",
              gradesAr: "Year 7–9",
              ageEn: "Ages 11–14",
              ageAr: "الأعمار ١١–١٤",
              coreSubjects: corePrep,
              enrichmentCourses: enrichmentBuilder,
              highlightEn: "Better problem-solving and stronger outcomes.",
              highlightAr: "حل مسائل أقوى ونتائج أفضل.",
            },
          ],
        },
        {
          key: "secondary",
          titleEn: "IGCSE / A-Levels",
          titleAr: "IGCSE / A-Levels",
          descEn: "Specialization + high-level outcomes.",
          descAr: "تخصص + مخرجات عالية المستوى.",
          levels: [
            {
              id: "uk-igcse",
              titleEn: "IGCSE",
              titleAr: "IGCSE",
              gradesEn: "Year 10–11",
              gradesAr: "Year 10–11",
              ageEn: "Ages 14–16",
              ageAr: "الأعمار ١٤–١٦",
              coreSubjects: coreSecondary,
              enrichmentCourses: enrichmentAdvanced,
              highlightEn: "Exam technique + publishable outcomes.",
              highlightAr: "تقنيات امتحان + مخرجات قابلة للعرض.",
            },
            {
              id: "uk-alevel",
              titleEn: "A-Levels",
              titleAr: "A-Levels",
              gradesEn: "Year 12–13",
              gradesAr: "Year 12–13",
              ageEn: "Ages 16–18",
              ageAr: "الأعمار ١٦–١٨",
              coreSubjects: [
                { Icon: Target, en: "Specialization", ar: "تخصص" },
                { Icon: GraduationCap, en: "University readiness", ar: "جاهزية الجامعة" },
              ],
              enrichmentCourses: enrichmentAdvanced,
              highlightEn: "High-impact capstones for applications.",
              highlightAr: "مشاريع قوية للتقديم للجامعة.",
            },
          ],
        },
      ],
    };

    const ib: EduSystem = {
      key: "ib",
      titleEn: "IB (PYP / MYP / DP)",
      titleAr: "IB (PYP / MYP / DP)",
      descEn: "Inquiry-led learning with reflection and skills.",
      descAr: "تعلم قائم على الاستقصاء مع مهارات وتأمل.",
      accent: "bg-[#111624]",
      stages: [
        {
          key: "primary",
          titleEn: "PYP",
          titleAr: "PYP",
          descEn: "Inquiry, communication, and creativity.",
          descAr: "استقصاء وتواصل وإبداع.",
          levels: [
            {
              id: "ib-pyp",
              titleEn: "Primary Years Programme",
              titleAr: "PYP",
              gradesEn: "PYP (multi-level)",
              gradesAr: "PYP (مستويات متعددة)",
              ageEn: "Ages 5–12",
              ageAr: "الأعمار ٥–١٢",
              coreSubjects: [
                { Icon: Brain, en: "Inquiry", ar: "استقصاء" },
                { Icon: Languages, en: "Language", ar: "لغة" },
                { Icon: Calculator, en: "Math", ar: "رياضيات" },
                { Icon: FlaskConical, en: "Science", ar: "علوم" },
              ],
              enrichmentCourses: enrichmentStarter,
              highlightEn: "Projects connected to real-world themes.",
              highlightAr: "مشاريع مرتبطة بموضوعات حياتية.",
            },
          ],
        },
        {
          key: "prep",
          titleEn: "MYP",
          titleAr: "MYP",
          descEn: "Interdisciplinary thinking + strong builds.",
          descAr: "تفكير متعدد التخصصات + مشاريع قوية.",
          levels: [
            {
              id: "ib-myp",
              titleEn: "Middle Years Programme",
              titleAr: "MYP",
              gradesEn: "MYP (Years 1–5)",
              gradesAr: "MYP (سنوات ١–٥)",
              ageEn: "Ages 11–16",
              ageAr: "الأعمار ١١–١٦",
              coreSubjects: corePrep,
              enrichmentCourses: enrichmentBuilder,
              highlightEn: "Perfect for building a strong portfolio early.",
              highlightAr: "ممتاز لبناء بورتفوليو مبكرًا.",
            },
          ],
        },
        {
          key: "secondary",
          titleEn: "DP",
          titleAr: "DP",
          descEn: "High-level outcomes + university readiness.",
          descAr: "مخرجات قوية + جاهزية الجامعة.",
          levels: [
            {
              id: "ib-dp",
              titleEn: "Diploma Programme",
              titleAr: "DP",
              gradesEn: "DP 1–2",
              gradesAr: "DP 1–2",
              ageEn: "Ages 16–18",
              ageAr: "الأعمار ١٦–١٨",
              coreSubjects: [
                { Icon: GraduationCap, en: "Extended outcomes", ar: "مخرجات ممتدة" },
                { Icon: Target, en: "Specialization", ar: "تخصص" },
              ],
              enrichmentCourses: enrichmentAdvanced,
              highlightEn: "Capstones that stand out in applications.",
              highlightAr: "مشاريع تميّز ملف التقديم.",
            },
          ],
        },
      ],
    };

    return [egyptian, american, british, ib];
  }, []);

  const [activeSystem, setActiveSystem] = useState<SystemKey>("egyptian");
  const [activeStage, setActiveStage] = useState<StageKey>("primary");

  const system = systems.find((s) => s.key === activeSystem) ?? systems[0];

  // ✅ No effect + no state update. Always resolve to a valid stage for current system.
  const resolvedStageKey: StageKey = system.stages.some((s) => s.key === activeStage)
    ? activeStage
    : system.stages.some((s) => s.key === "primary")
      ? "primary"
      : (system.stages[0]?.key ?? "primary");

  const stage = system.stages.find((s) => s.key === resolvedStageKey) ?? system.stages[0];

  return (
    <div className="bg-[#F18A68]" dir={isRTL ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-0">
        <div className="relative overflow-hidden rounded-[36px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.10)] ring-1 ring-black/5">
          {/* blobs */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#08ABD3]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#A2BF00]/22 blur-3xl" />
          <div className="pointer-events-none absolute top-20 right-10 h-40 w-40 rounded-full bg-[#FDCF2F]/25 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-black/10 to-transparent" />

          <div className="relative p-7 sm:p-10">
            {/* chips */}
            <div className={`flex flex-wrap items-center gap-2 ${isRTL ? "justify-end" : ""}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#111624]/5 px-3 py-1 text-xs font-semibold text-[#111624]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#EB420E]" />
                {t(lang, "Curriculum & School Subjects", "تعليم ومناهج دراسية")}
              </span>

              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${system.accent}`}>
                <span className="inline-block h-2 w-2 rounded-full bg-white/90" />
                {t(lang, system.titleEn, system.titleAr)}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#111624] ring-1 ring-black/5">
                <Sparkles className="h-4 w-4 text-[#EB420E]" />
                {t(lang, "Exam-ready outcomes", "مخرجات جاهزة للامتحانات")}
              </span>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              {/* left */}
              <div className={textAlign}>
                <h1 className="text-balance text-4xl font-black leading-tight text-[#111624] sm:text-5xl">
                  {lang === "en" ? (
                    <>
                      One clear map for every <span className="text-[#EB420E]">curriculum</span>, stage, and grade.
                    </>
                  ) : (
                    <>
                      خريطة واضحة لكل <span className="text-[#EB420E]">منهج</span> ومرحلة وصف.
                    </>
                  )}
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#111624]/70">
                  {t(
                    lang,
                    "Choose the system, then stage, and you'll see recommended subjects and structured study plans that match the grade.",
                    "اختار المنهج ثم المرحلة، وهتلاقي المواد المناسبة وخطة مذاكرة منظمة حسب الصف."
                  )}
                </p>

                <div className={`mt-6 flex flex-wrap gap-2 ${isRTL ? "justify-end" : ""}`}>
                  <ImpactPill label={t(lang, "Weekly practice", "تدريب أسبوعي")} />
                  <ImpactPill label={t(lang, "Revision plans", "خطط مراجعة")} />
                  <ImpactPill label={t(lang, "Quizzes & follow-up", "اختبارات ومتابعة")} />
                  <ImpactPill label={t(lang, "Parent tracking", "متابعة ولي الأمر")} />
                </div>

                <div className={`mt-8 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
                  <a
                    href="#catalog"
                    className="inline-flex items-center gap-2 rounded-full bg-[#111624] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111624]/90"
                  >
                    {t(lang, "Browse curriculum", "تصفح المناهج")}
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

              {/* right */}
              <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur">
                <div className={isRTL ? "text-right" : "text-left"}>
                  <h3 className="text-lg font-extrabold text-[#111624]">
                    {t(lang, "How curriculum support works", "إزاي دعم المناهج بيشتغل")}
                  </h3>
                  <p className="mt-1 text-sm text-[#111624]/70">
                    {t(lang, "Simple steps that show progress fast.", "خطوات بسيطة بتظهر التقدم بسرعة.")}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  <HeroStep
                    isRTL={isRTL}
                    icon={<Target className="h-4 w-4 text-[#111624]" />}
                    title={t(lang, "Placement & goals", "تحديد المستوى والهدف")}
                    body={t(lang, "We align to the grade and exam requirements.", "بنحدد المطلوب حسب الصف والامتحانات.")}
                  />
                  <HeroStep
                    isRTL={isRTL}
                    icon={<Users className="h-4 w-4 text-[#111624]" />}
                    title={t(lang, "Guided sessions", "جلسات بإرشاد")}
                    body={t(lang, "Live guidance to ensure understanding (not memorizing).", "إرشاد مباشر لضمان الفهم (مش حفظ).")}
                  />
                  <HeroStep
                    isRTL={isRTL}
                    icon={<GraduationCap className="h-4 w-4 text-[#111624]" />}
                    title={t(lang, "Revision & exams", "مراجعة وامتحانات")}
                    body={t(lang, "Weekly quizzes + revision plans near exams.", "اختبارات أسبوعية + مراجعة قبل الامتحانات.")}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <StatPill label={t(lang, "Stages", "مراحل")} value="KG–12" />
                  <StatPill label={t(lang, "Ages", "الأعمار")} value="6–17" />
                  <StatPill label={t(lang, "Systems", "مناهج")} value="4" />
                </div>
              </div>
            </div>

            <p className={`mt-7 text-xs text-[#111624]/55 ${textAlign}`}>
              {t(
                lang,
                "Tip: Select the curriculum system below, then pick the stage to see levels and recommended subjects.",
                "نصيحة: اختار المنهج ثم المرحلة علشان تشوف المستويات والمواد المقترحة."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
          <div className={`mb-10 ${textAlign}`}>
            <h2 className="text-3xl font-bold text-[#111624]">
              {t(lang, "Curriculum Catalog", "دليل المناهج")}
            </h2>
            <p className="mt-3 text-lg text-[#111624]/70">
              {t(
                lang,
                "Choose the system, then stage, to see recommended subjects and enrichment options by level.",
                "اختار المنهج ثم المرحلة لعرض المواد المقترحة وخيارات الإثراء حسب المستوى."
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-[#F8F9FA] p-6">
            <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${textAlign}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${system.accent}`}>
                    <span className="inline-block h-2 w-2 rounded-full bg-white/90" />
                    {t(lang, system.titleEn, system.titleAr)}
                  </span>
                  <span className="text-xs font-semibold text-[#111624]/60">
                    {t(lang, system.descEn, system.descAr)}
                  </span>
                </div>

                <div className={`mt-4 flex flex-wrap gap-2 ${isRTL ? "justify-end" : ""}`}>
                  {systems.map((s) => {
                    const active = s.key === activeSystem;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setActiveSystem(s.key)}
                        className={[
                          "rounded-full px-4 py-2 text-xs font-semibold transition",
                          active
                            ? `${s.accent} text-white shadow-sm`
                            : "bg-white text-[#111624] ring-1 ring-black/5 hover:bg-[#111624]/5",
                        ].join(" ")}
                      >
                        {t(lang, s.titleEn, s.titleAr)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <a
                href={`/auth/register-parent?lang=${lang}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
              >
                {t(lang, "Register your child", "سجّل ابنك الآن")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              </a>
            </div>

            {/* Stage tabs */}
            <div className={`mt-6 flex flex-wrap gap-2 ${isRTL ? "justify-end" : ""}`}>
              {system.stages.map((st) => {
                const active = st.key === resolvedStageKey;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setActiveStage(st.key)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-white text-[#111624] shadow-sm ring-1 ring-black/5"
                        : "bg-[#111624]/5 text-[#111624]/80 hover:bg-[#111624]/10",
                    ].join(" ")}
                  >
                    {t(lang, st.titleEn, st.titleAr)}
                  </button>
                );
              })}
            </div>

            <p className={`mt-4 text-sm text-[#111624]/70 ${textAlign}`}>
              {t(lang, stage?.descEn ?? "", stage?.descAr ?? "")}
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {(stage?.levels ?? []).map((lvl) => (
                <LevelCard key={lvl.id} lang={lang} level={lvl} isRTL={isRTL} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =============================================================================
 * Small UI pieces (defined OUTSIDE component to avoid "created during render")
 * ============================================================================= */

function ImpactPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#F8F9FA] px-4 py-2 text-xs font-semibold text-[#111624] ring-1 ring-black/5">
      {label}
    </span>
  );
}

function HeroStep({
  isRTL,
  icon,
  title,
  body,
}: {
  isRTL: boolean;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111624]/5">
        {icon}
      </div>
      <div className={isRTL ? "text-right" : "text-left"}>
        <p className="text-sm font-extrabold text-[#111624]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#111624]/70">{body}</p>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-black/5">
      <p className="text-[11px] font-semibold text-[#111624]/60">{label}</p>
      <p className="mt-1 text-sm font-black text-[#111624]">{value}</p>
    </div>
  );
}

type Lang = "en" | "ar";
type Chip = { Icon: LucideIcon; en: string; ar: string };
type Level = {
  id: string;
  titleEn: string;
  titleAr: string;
  gradesEn: string;
  gradesAr: string;
  ageEn: string;
  ageAr: string;
  coreSubjects: Chip[];
  enrichmentCourses: Chip[];
  highlightEn: string;
  highlightAr: string;
};

function tLocal(lang: Lang, en: string, ar: string) {
  return lang === "ar" ? ar : en;
}

function Pill({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#111624] ring-1 ring-[#111624]/10">
      <Icon className="h-3.5 w-3.5 text-[#111624]/70" />
      {label}
    </span>
  );
}

function LevelCard({ lang, level, isRTL }: { lang: Lang; level: Level; isRTL: boolean }) {
  const textAlign = isRTL ? "text-right" : "text-left";

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className={textAlign}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-black text-[#111624]">
            {tLocal(lang, level.titleEn, level.titleAr)}
          </h3>

          <span className="rounded-full bg-[#111624]/5 px-3 py-1 text-xs font-semibold text-[#111624]/80">
            {tLocal(lang, level.gradesEn, level.gradesAr)}
          </span>

          <span className="rounded-full bg-[#FDCF2F]/30 px-3 py-1 text-xs font-semibold text-[#111624]">
            {tLocal(lang, level.ageEn, level.ageAr)}
          </span>
        </div>

        <p className="mt-2 text-sm text-[#111624]/70">
          {tLocal(lang, level.highlightEn, level.highlightAr)}
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[#F8F9FA] p-4">
            <p className="text-xs font-extrabold text-[#111624]">
              {tLocal(lang, "Core subjects", "المواد الأساسية")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {level.coreSubjects.map((c) => (
                <Pill key={`${level.id}-core-${c.en}`} Icon={c.Icon} label={tLocal(lang, c.en, c.ar)} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#F8F9FA] p-4">
            <p className="text-xs font-extrabold text-[#111624]">
              {tLocal(lang, "Enrichment options", "إثراء ومهارات إضافية")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {level.enrichmentCourses.map((c) => (
                <Pill key={`${level.id}-enr-${c.en}`} Icon={c.Icon} label={tLocal(lang, c.en, c.ar)} />
              ))}
            </div>
          </div>
        </div>

        <div className={`mt-5 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
          <a
            href={`/auth/register-parent?lang=${lang}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#111624] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111624]/90"
          >
            {tLocal(lang, "Start this level", "ابدأ هذا المستوى")}
            <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
          </a>

          <a
            href={`/?lang=${lang}#how-it-works`}
            className="inline-flex items-center gap-2 rounded-full bg-[#111624]/10 px-5 py-2.5 text-sm font-semibold text-[#111624] transition hover:bg-[#111624]/15"
          >
            {tLocal(lang, "How it works", "كيف يعمل")}
            <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
          </a>
        </div>
      </div>
    </div>
  );
}

function CurriculumPageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export default function CurriculumPage() {
  return (
    <Suspense fallback={<CurriculumPageFallback />}>
      <CurriculumPageContent />
    </Suspense>
  );
}
