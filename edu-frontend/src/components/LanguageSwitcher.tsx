// src/components/LanguageSwitcher.tsx
"use client";

/**
 * LanguageSwitcher
 * -----------------------------------------------------------------------------
 * - Reads the current language from the URL query (?lang=ar).
 * - When toggled, updates the URL using router.push:
 *      • English = default → removes lang param
 *      • Arabic           → sets ?lang=ar
 * - This makes language:
 *      • Persist across refresh
 *      • Shareable via URL
 *      • Available to any page using useSearchParams()
 * -----------------------------------------------------------------------------
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine current language from query string: ?lang=ar → "ar", otherwise "en"
  const currentLang: "en" | "ar" =
    searchParams.get("lang") === "ar" ? "ar" : "en";

  const changeLang = (lang: "en" | "ar") => {
    // Clone current search params to avoid mutating read-only object
    const params = new URLSearchParams(searchParams.toString());

    if (lang === "en") {
      // For English (default), we remove the `lang` param from the URL
      params.delete("lang");
    } else {
      // For Arabic, we explicitly set `lang=ar`
      params.set("lang", "ar");
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(targetUrl);
  };

  return (
    <div className="inline-flex items-center rounded-full bg-white/20 p-1 text-xs font-semibold text-white backdrop-blur-sm sm:text-sm">
      {/* EN button */}
      <button
        type="button"
        onClick={() => changeLang("en")}
        className={`rounded-full px-2 py-1 transition-colors ${
          currentLang === "en"
            ? "bg-white text-[#111624] shadow-sm"
            : "text-white/70 hover:text-white"
        }`}
      >
        EN
      </button>

      {/* AR button */}
      <button
        type="button"
        onClick={() => changeLang("ar")}
        className={`rounded-full px-2 py-1 transition-colors ${
          currentLang === "ar"
            ? "bg-white text-[#111624] shadow-sm"
            : "text-white/70 hover:text-white"
        }`}
      >
        AR
      </button>
    </div>
  );
}
