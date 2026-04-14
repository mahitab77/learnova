"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, GraduationCap, UserPlus } from "lucide-react";

type Lang = "en" | "ar";

function HowItWorksPageContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";
  const textAlign = isRTL ? "text-right" : "text-left";

  const steps = [
    {
      icon: <UserPlus className="h-6 w-6 text-white" />,
      color: "bg-[#08ABD3]",
      title: lang === "en" ? "Sign up & add your child" : "سجّل وأضف طفلك",
      body:
        lang === "en"
          ? "Create a parent account, then add your child’s grade level and subjects."
          : "أنشئ حساب ولي أمر، ثم أضف مرحلة طفلك الدراسية والمواد.",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      color: "bg-[#A2BF00]",
      title: lang === "en" ? "Browse & choose a teacher" : "تصفح واختر المعلم",
      body:
        lang === "en"
          ? "Explore available teachers by subject and grade level, then pick the right fit for your child."
          : "استعرض المعلمين المتاحين حسب المادة والمرحلة، واختر الأنسب لطفلك.",
    },
    {
      icon: <Calendar className="h-6 w-6 text-white" />,
      color: "bg-[#FDCF2F]",
      title: lang === "en" ? "Request a session" : "اطلب حصة دراسية",
      body:
        lang === "en"
          ? "Submit a lesson request. The teacher reviews it and confirms a suitable time."
          : "أرسل طلب حصة. يراجع المعلم الطلب ويؤكد الموعد المناسب.",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-white" />,
      color: "bg-[#EB420E]",
      title: lang === "en" ? "Attend & track progress" : "احضر وتابع التقدم",
      body:
        lang === "en"
          ? "Your child joins confirmed sessions while you follow attendance and results from your dashboard."
          : "يحضر طفلك الحصص المؤكدة وأنت تتابع الحضور والنتائج من لوحة التحكم.",
    },
  ];

  return (
    <div className="bg-[#F18A68]" dir={isRTL ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-0">
        <div className="rounded-3xl bg-white px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
          <h1 className={`text-balance text-4xl font-black leading-tight text-[#111624] sm:text-5xl ${textAlign}`}>
            {lang === "en" ? "How LearnNova Works" : "كيف تعمل منصة ليرن نوفا"}
          </h1>
          <p className={`mt-4 max-w-3xl text-lg leading-relaxed text-[#111624]/70 ${textAlign}`}>
            {lang === "en"
              ? "A clear, simple flow: sign up → choose a teacher → request a session → track progress."
              : "خطوات واضحة وبسيطة: تسجيل → اختيار معلم → طلب حصة → متابعة التقدم."}
          </p>

          <div className={`mt-8 flex flex-wrap gap-3 ${isRTL ? "justify-end" : ""}`}>
            <a
              href={`/?lang=${lang}#how-it-works`}
              className="inline-flex items-center gap-2 rounded-full bg-[#111624]/10 px-6 py-3 text-sm font-semibold text-[#111624] transition-colors hover:bg-[#111624]/15"
            >
              {lang === "en" ? "Back to Home" : "العودة للرئيسية"}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={`/auth/register-parent?lang=${lang}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#A2BF00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8fa800]"
            >
              {lang === "en" ? "Get started" : "ابدأ الآن"}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
          <div className={`mb-10 ${textAlign}`}>
            <h2 className="text-3xl font-bold text-[#111624]">
              {lang === "en" ? "Step-by-step" : "الخطوات بالتفصيل"}
            </h2>
            <p className="mt-3 text-lg text-[#111624]/70">
              {lang === "en"
                ? "Everything is designed to be quick for parents and exciting for students."
                : "كل شيء مصمم ليكون سريعاً لولي الأمر وممتعاً للطلاب."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((s, idx) => (
              <div key={idx} className="rounded-2xl border border-[#111624]/10 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${s.color}`}>
                    {s.icon}
                  </div>
                  <div className={textAlign}>
                    <h3 className="text-xl font-bold text-[#111624]">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#111624]/70">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-[#F8F9FA] p-8">
            <h3 className={`text-xl font-bold text-[#111624] ${textAlign}`}>
              {lang === "en" ? "What parents get" : "ماذا يحصل ولي الأمر؟"}
            </h3>
            <ul className={`mt-4 space-y-2 text-sm text-[#111624]/75 ${textAlign}`}>
              <li>• {lang === "en" ? "Clear progress view" : "عرض واضح للتقدم"}</li>
              <li>• {lang === "en" ? "Attendance tracking" : "متابعة الحضور"}</li>
              <li>• {lang === "en" ? "Grades and assignment results" : "الدرجات ونتائج الواجبات"}</li>
              <li>• {lang === "en" ? "Request lessons in a few clicks" : "طلب حصص بنقرات قليلة"}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function HowItWorksPageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<HowItWorksPageFallback />}>
      <HowItWorksPageContent />
    </Suspense>
  );
}
