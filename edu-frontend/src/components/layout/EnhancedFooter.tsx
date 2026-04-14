// src/components/layout/EnhancedFooter.tsx
"use client";

/**
 * EnhancedFooter (LearnNova) — Cleaned (removed the 3 informational cards)
 * -----------------------------------------------------------------------------
 * ✅ Keeps footer aligned with the new navbar "Explore" categories (5)
 * ✅ Keeps bilingual (EN/AR) + RTL/LTR
 * ✅ Keeps Link + withLang for consistent navigation
 *
 * ✅ CHANGE REQUEST:
 * - Removed the 3 cards shown in the screenshot:
 *   • "Curriculum subjects"
 *   • "Arts & skills"
 *   • "General courses"
 *
 * ✅ ESLint FIX (THIS UPDATE):
 * - Your ESLint rule `react-hooks/set-state-in-effect` forbids setState inside useEffect.
 * - So we removed "mounted/year state" patterns entirely.
 * - We instead use `suppressHydrationWarning` for the newsletter form wrapper to avoid
 *   hydration mismatch warnings from extensions injecting attributes into form elements.
 */

import type { FC } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Heart,
  BookOpen,
  BookText,
  Languages,
  Palette,
  GraduationCap,
  Sparkles,
} from "lucide-react";

type Lang = "en" | "ar";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Append lang query param to keep language consistent across pages. */
function withLang(path: string, lang: Lang) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}

const EnhancedFooter: FC = () => {
  /* ------------------------------------------------------------------------ */
  /* Page + Language Context                                                  */
  /* ------------------------------------------------------------------------ */

  const searchParams = useSearchParams();
  const pathname = usePathname();

  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRTL = lang === "ar";
  const textAlign = isRTL ? "text-right" : "text-left";

  const isHome = pathname === "/" || pathname === "";

  /**
   * Footer "Quick Links" behavior:
   * - If you're already on home, use # anchors for smooth section jumps.
   * - If you're not on home, route to the dedicated pages.
   * - Explore link: goes to the home "courses" section (since it's a homepage section).
   */
  const homeAnchors = {
    home: isHome ? "#home" : withLang("/#home", lang),
    how: isHome ? "#how-it-works" : withLang("/how-it-works", lang),
    testimonials: isHome ? "#testimonials" : withLang("/testimonials", lang),
    exploreSection: isHome ? "#courses" : withLang("/#courses", lang),
  };

  /* ------------------------------------------------------------------------ */
  /* Explore Categories (matches navbar structure)                             */
  /* ------------------------------------------------------------------------ */

  const explore = [
    {
      icon: <BookOpen className="h-4 w-4 text-[#08ABD3]" />,
      name: lang === "en" ? "Curriculum" : "تعليم ومناهج دراسية",
      href: "/curriculum",
      sub: lang === "en" ? "Math, Science, Languages..." : "ماث، ساينس، لغات...",
    },
    {
      icon: <BookText className="h-4 w-4 text-[#A2BF00]" />,
      name: lang === "en" ? "Quran & Islamic" : "قرآن ومواد شرعية",
      href: "/quran",
      sub: lang === "en" ? "Quran & Sharia subjects" : "قرآن ومواد شرعية",
    },
    {
      icon: <Languages className="h-4 w-4 text-[#FDCF2F]" />,
      name: lang === "en" ? "Arabic (Non-Native)" : "لغة عربية لغير الناطقين",
      href: "/arabic",
      sub:
        lang === "en"
          ? "Arabic learning (not school curriculum)"
          : "تعلم عربي (مش مناهج)",
    },
    {
      icon: <Palette className="h-4 w-4 text-[#EB420E]" />,
      name: lang === "en" ? "Arts & Skills" : "فنون ومهارات",
      href: "/arts",
      sub:
        lang === "en"
          ? "Drawing, music, handmade..."
          : "رسم، ميوزيك، أعمال يدوية...",
    },
    {
      icon: <GraduationCap className="h-4 w-4 text-[#B19CD9]" />,
      name: lang === "en" ? "General Courses" : "كورسات عامة",
      href: "/courses",
      sub: lang === "en" ? "Languages & programming" : "لغات وبرمجة",
    },
  ] as const;

  // Client component → safe to compute inline
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#111624] pt-12 pb-8 text-white" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
        {/* ------------------------------------------------------------------ */}
        {/* Main Footer Grid                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-8 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* ---------------------------------------------------------------- */}
          {/* Brand Column                                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className={`${textAlign} lg:col-span-1`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A2BF00] text-lg font-bold text-white">
                LN
              </div>
              <div>
                <h3 className="text-xl font-bold">LearnNova</h3>
                <p className="text-sm text-gray-300">
                  {lang === "en" ? "Smart EDU Platform" : "منصة تعليمية ذكية"}
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              {lang === "en"
                ? "A modern platform that connects students with the right teachers — curriculum, Quran, languages, arts, and courses."
                : "منصة حديثة بتوصّل الطالب بالمدرس المناسب — مناهج، قرآن، لغات، فنون، وكورسات."}
            </p>

            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white transition-all hover:scale-110 hover:bg-[#A2BF00]"
                  aria-label="social"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Quick Links                                                       */}
          {/* ---------------------------------------------------------------- */}
          <div className={textAlign}>
            <h4 className="mb-4 text-lg font-semibold text-white">
              {lang === "en" ? "Quick Links" : "روابط سريعة"}
            </h4>

            <ul className="space-y-2">
              <li>
                {isHome ? (
                  <a
                    href={homeAnchors.home}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "Home" : "الرئيسية"}
                  </a>
                ) : (
                  <Link
                    href={withLang("/", lang)}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "Home" : "الرئيسية"}
                  </Link>
                )}
              </li>

              <li>
                {isHome ? (
                  <a
                    href={homeAnchors.exploreSection}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "Explore" : "استكشف"}
                  </a>
                ) : (
                  <Link
                    href={homeAnchors.exploreSection}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "Explore" : "استكشف"}
                  </Link>
                )}
              </li>

              <li>
                {isHome ? (
                  <a
                    href={homeAnchors.how}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "How It Works" : "كيف تعمل"}
                  </a>
                ) : (
                  <Link
                    href={homeAnchors.how}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "How It Works" : "كيف تعمل"}
                  </Link>
                )}
              </li>

              <li>
                {isHome ? (
                  <a
                    href={homeAnchors.testimonials}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "Testimonials" : "آراء العملاء"}
                  </a>
                ) : (
                  <Link
                    href={homeAnchors.testimonials}
                    className="text-sm text-gray-300 transition-colors hover:text-[#A2BF00]"
                  >
                    {lang === "en" ? "Testimonials" : "آراء العملاء"}
                  </Link>
                )}
              </li>
            </ul>

            {/* Helpful hint / micro-copy */}
            <div className="mt-5 rounded-2xl bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <Sparkles className="h-4 w-4 text-[#FDCF2F]" />
                {lang === "en" ? "Find the right teacher fast" : "اختار المدرس المناسب بسرعة"}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-300">
                {lang === "en"
                  ? "Pick a category, then (for curriculum) choose stage, and browse teacher cards."
                  : "اختار القسم، ثم (للمناهج) المرحلة، وشوف كروت المدرسين."}
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Explore Categories                                                 */}
          {/* ---------------------------------------------------------------- */}
          <div className={textAlign}>
            <h4 className="mb-4 text-lg font-semibold text-white">
              {lang === "en" ? "Explore" : "استكشف"}
            </h4>

            <ul className="space-y-2">
              {explore.map((it) => (
                <li key={it.href}>
                  <Link
                    href={withLang(it.href, lang)}
                    className="group flex items-start gap-3 rounded-xl px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                      {it.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{it.name}</span>
                      <span className="block text-xs text-gray-400 transition-colors group-hover:text-gray-300">
                        {it.sub}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Contact Info                                                       */}
          {/* ---------------------------------------------------------------- */}
          <div className={textAlign}>
            <h4 className="mb-4 text-lg font-semibold text-white">
              {lang === "en" ? "Contact Us" : "اتصل بنا"}
            </h4>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-[#A2BF00]" />
                <span>hello@learnnova.com</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Phone className="h-4 w-4 text-[#08ABD3]" />
                <span>+1 (555) 123-4567</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-[#FDCF2F]" />
                <span>
                  {lang === "en"
                    ? "123 Education St, Learning City"
                    : "شارع التعليم 123، مدينة التعلم"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Newsletter Subscription                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-8 border-t border-gray-700 pt-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className={`${textAlign} md:text-left`}>
              <h4 className="mb-2 text-lg font-semibold">
                {lang === "en" ? "Stay Updated" : "ابقَ على اطلاع"}
              </h4>
              <p className="text-sm text-gray-300">
                {lang === "en"
                  ? "Subscribe to receive new teachers, new subjects, and new course announcements."
                  : "اشترك لتصلك أحدث الإضافات: مدرسين جدد، مواد جديدة، وإعلانات الكورسات."}
              </p>
            </div>

            {/* 
              ✅ Hydration-mismatch guard:
              Some extensions inject attributes into inputs/buttons pre-hydration.
              suppressHydrationWarning tells React to ignore minor attribute differences here.
            */}
            <div suppressHydrationWarning className="flex w-full gap-2 md:w-auto">
              <input
                type="email"
                placeholder={lang === "en" ? "Your email address" : "بريدك الإلكتروني"}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A2BF00] md:w-64"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              />
              <button
                type="button"
                className="rounded-lg bg-[#A2BF00] px-6 py-2 font-semibold text-white transition-all hover:scale-105 hover:bg-[#8fa800]"
                data-lpignore="true"
                data-1p-ignore="true"
              >
                {lang === "en" ? "Subscribe" : "اشتراك"}
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Bottom Bar                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className={`text-sm text-gray-300 ${textAlign}`}>
              <p>
                © {year} LearnNova. {lang === "en" ? "All rights reserved." : "جميع الحقوق محفوظة."}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <Link
                href={withLang("/privacy", lang)}
                className="transition-colors hover:text-[#A2BF00]"
              >
                {lang === "en" ? "Privacy Policy" : "سياسة الخصوصية"}
              </Link>
              <Link
                href={withLang("/terms", lang)}
                className="transition-colors hover:text-[#08ABD3]"
              >
                {lang === "en" ? "Terms of Service" : "شروط الخدمة"}
              </Link>
              <Link
                href={withLang("/contact", lang)}
                className="transition-colors hover:text-[#FDCF2F]"
              >
                {lang === "en" ? "Contact" : "اتصل بنا"}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>{lang === "en" ? "Made with" : "مصنوع بـ"}</span>
              <Heart className="h-4 w-4 fill-current text-red-500" />
              <span>{lang === "en" ? "for education" : "من أجل التعليم"}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
