"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Quote, Star } from "lucide-react";

type Lang = "en" | "ar";

type TItem = {
  badgeEn: string;
  badgeAr: string;
  color: string;
  textEn: string;
  textAr: string;
};

function TestimonialsPageContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";
  const textAlign = isRTL ? "text-right" : "text-left";

  const items: TItem[] = [
    {
      badgeEn: "Parent of 10-year-old",
      badgeAr: "ولية أمر (10 سنوات)",
      color: "#A2BF00",
      textEn:
        "My son used to spend hours on games only. Now he builds simple games and understands coding basics.",
      textAr:
        "ابني كان بيقضي وقته كله على الألعاب، دلوقتي بقى بيبني ألعاب بسيطة بنفسه وفاهم أساسيات البرمجة.",
    },
    {
      badgeEn: "Parent of 14-year-old",
      badgeAr: "ولي أمر (14 سنة)",
      color: "#08ABD3",
      textEn:
        "The platform is organized and clear. I can follow my daughter’s progress and see her projects easily.",
      textAr:
        "المنصة منظمة وواضحة، وبقدر أتابع تقدم بنتي ومشاريعها بسهولة من لوحة واحدة.",
    },
    {
      badgeEn: "Parent of 12-year-old",
      badgeAr: "ولية أمر (12 سنة)",
      color: "#EB420E",
      textEn:
        "Teachers are patient and supportive. My child looks forward to every session and built real projects.",
      textAr:
        "المدرسون رائعون ومرنين. ابني بيكون متحمس لكل حصة وعمل مشاريع حقيقية.",
    },
    {
      badgeEn: "Parent of 8-year-old",
      badgeAr: "ولي أمر (8 سنوات)",
      color: "#FDCF2F",
      textEn:
        "The lessons are fun and structured. I’m surprised by how quickly my child started creating.",
      textAr:
        "الدروس ممتعة ومنظمة. اتفاجئت بسرعة قد إيه طفلي بدأ يبدع ويعمل حاجات بنفسه.",
    },
    {
      badgeEn: "Parent of 16-year-old",
      badgeAr: "ولي أمر (16 سنة)",
      color: "#9B5DE5",
      textEn:
        "Great project-based learning. The outcomes feel meaningful, not just theory.",
      textAr:
        "تعلم قائم على المشاريع بشكل ممتاز. النتائج ملموسة ومش مجرد كلام نظري.",
    },
    {
      badgeEn: "Parent of siblings",
      badgeAr: "ولي أمر لإخوة",
      color: "#111624",
      textEn:
        "Having multiple students under one account makes everything easy to manage.",
      textAr:
        "وجود أكثر من طالب تحت حساب واحد خلّى الإدارة والمتابعة سهلة جداً.",
    },
  ];

  return (
    <div className="bg-[#F18A68]" dir={isRTL ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-0">
        <div className="rounded-3xl bg-white px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
          <h1 className={`text-balance text-4xl font-black leading-tight text-[#111624] sm:text-5xl ${textAlign}`}>
            {lang === "en" ? "What Parents Say" : "ماذا يقول أولياء الأمور؟"}
          </h1>
          <p className={`mt-4 max-w-3xl text-lg leading-relaxed text-[#111624]/70 ${textAlign}`}>
            {lang === "en"
              ? "Real feedback that highlights confidence, clarity, and project outcomes."
              : "آراء تُظهر الثقة والوضوح ونتائج المشاريع."}
          </p>

          <div className={`mt-6 flex items-center gap-2 ${isRTL ? "justify-end" : ""}`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="h-5 w-5 fill-[#FDCF2F] text-[#FDCF2F]" />
            ))}
            <span className="text-sm font-semibold text-[#111624]/70">
              {lang === "en" ? "Loved by families" : "محبوبة لدى العائلات"}
            </span>
          </div>

          <div className={`mt-8 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
            <a
              href={`/?lang=${lang}#testimonials`}
              className="inline-flex items-center gap-2 rounded-full bg-[#111624]/10 px-6 py-3 text-sm font-semibold text-[#111624] transition-colors hover:bg-[#111624]/15"
            >
              {lang === "en" ? "Back to Home" : "العودة للرئيسية"}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={`/auth/register-parent?lang=${lang}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
            >
              {lang === "en" ? "Join now" : "انضم الآن"}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
          <div className={`mb-10 ${textAlign}`}>
            <h2 className="text-3xl font-bold text-[#111624]">
              {lang === "en" ? "Testimonials" : "آراء العملاء"}
            </h2>
            <p className="mt-3 text-lg text-[#111624]/70">
              {lang === "en"
                ? "A bigger collection of parent feedback."
                : "مجموعة أكبر من آراء أولياء الأمور."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-2xl border border-[#111624]/10 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Quote className="h-5 w-5" style={{ color: it.color }} />
                  <span className="text-sm font-semibold" style={{ color: it.color }}>
                    {lang === "en" ? it.badgeEn : it.badgeAr}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-[#111624]/75">
                  {lang === "en" ? it.textEn : it.textAr}
                </p>

                <div className="mt-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-4 w-4 fill-[#FDCF2F] text-[#FDCF2F]" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-[#F8F9FA] p-8">
            <h3 className={`text-xl font-bold text-[#111624] ${textAlign}`}>
              {lang === "en" ? "Want to share your story?" : "هل تريد مشاركة تجربتك؟"}
            </h3>
            <p className={`mt-2 text-sm text-[#111624]/70 ${textAlign}`}>
              {lang === "en"
                ? "We’d love to hear about your child’s journey and projects."
                : "يسعدنا سماع رحلة طفلك والمشاريع التي أنجزها."}
            </p>

            <div className={`mt-6 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
              <a
                href={`/auth/login?lang=${lang}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#08ABD3] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0799c0]"
              >
                {lang === "en" ? "Sign in" : "تسجيل الدخول"}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={`/auth/register-parent?lang=${lang}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
              >
                {lang === "en" ? "Register" : "سجّل الآن"}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TestimonialsPageFallback() {
  return <div className="min-h-screen bg-[#F18A68]" />;
}

export default function TestimonialsPage() {
  return (
    <Suspense fallback={<TestimonialsPageFallback />}>
      <TestimonialsPageContent />
    </Suspense>
  );
}
