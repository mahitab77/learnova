// src/app/auth/login/page.tsx
"use client";

/**
 * Login Page (LearnNova) — Session-first (DROP-IN REPLACEMENT) — UPDATED
 * -----------------------------------------------------------------------------
 * ✅ Uses authService (cookie sessions via credentials: "include")
 * ✅ Session-first: after /auth/login, calls /auth/me to confirm session + role
 * ✅ Fixes TS: user possibly null (guards before reading user fields)
 * ✅ Dispatches "auth:changed" so navbar updates immediately (no manual refresh)
 * ✅ Keeps localStorage["edu-user"] for UI display ONLY (not auth)
 * ✅ Redirects by role without passing userId in URL
 * ✅ No `any` (ESLint strict friendly)
 */

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/src/services/authService";

/* =============================================================================
 * Types
 * =============================================================================
 */

type LoginData = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

type UiError = {
  message: string;
  details?: string;
};

/* =============================================================================
 * i18n
 * =============================================================================
 */

const loginTexts = {
  en: {
    title: "Login",
    subtitle: "Enter your email and password to sign in to LearnNova.",
    emailLabel: "Email",
    emailPlaceholder: "parent1@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    button: "Sign in",
    buttonLoading: "Signing in...",
    forgot: "Forgot password?",
    forgotHint: "Reset your password",
    createAccount: "Create parent account",
    createStudent: "Create student account",
    createAccountHint: "New to LearnNova?",
    genericError: "Unable to login. Please check your credentials.",
    requiredError: "Email and password are required.",
    sessionConfirmError: "Unable to confirm session after login.",
    footerNote: "",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  ar: {
    title: "تسجيل الدخول",
    subtitle: "ادخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول إلى LearnNova.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "parent1@example.com",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "••••••••",
    button: "تسجيل الدخول",
    buttonLoading: "جاري تسجيل الدخول...",
    forgot: "هل نسيت كلمة المرور؟",
    forgotHint: "إعادة تعيين كلمة المرور",
    createAccount: "إنشاء حساب ولي أمر",
    createStudent: "إنشاء حساب طالب",
    createAccountHint: "جديد في LearnNova؟",
    genericError: "تعذر تسجيل الدخول. يرجى التأكد من البريد الإلكتروني وكلمة المرور.",
    requiredError: "البريد الإلكتروني وكلمة المرور مطلوبان.",
    sessionConfirmError: "تعذر تأكيد الجلسة بعد تسجيل الدخول.",
    footerNote: "",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
  },
} as const;

type LangKey = keyof typeof loginTexts;

/* =============================================================================
 * Helpers
 * =============================================================================
 */

function toUiError(err: unknown, fallback: string): UiError {
  if (err instanceof Error) return { message: err.message || fallback };
  return { message: fallback };
}

/**
 * Role-based redirect
 * - Session-only: NO userId in URL
 * - Keep lang param only
 */
function roleToDashboard(
  role: string
):
  | "/student/dashboard"
  | "/parent/dashboard"
  | "/teacher/dashboard"
  | "/admin/dashboard"
  | "/moderator/dashboard"
  | "/" {
  const r = role.toLowerCase();
  if (r === "student") return "/student/dashboard";
  if (r === "parent") return "/parent/dashboard";
  if (r === "teacher") return "/teacher/dashboard";
  if (r === "admin") return "/admin/dashboard";
  if (r === "moderator") return "/moderator/dashboard";
  return "/";
}

function safeTrim(v: string) {
  return v.trim();
}

/* =============================================================================
 * Component
 * =============================================================================
 */

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const langParam = searchParams.get("lang");
  const lang: LangKey = langParam === "ar" ? "ar" : "en";
  const t = loginTexts[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UiError | null>(null);

  const withLang = (path: string) => (lang === "ar" ? `${path}?lang=ar` : path);

  const redirectByRole = (role: string) => {
    const base = roleToDashboard(role);
    router.push(lang === "ar" ? `${base}?lang=ar` : base);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = safeTrim(email);
    const cleanPassword = safeTrim(password);

    if (!cleanEmail || !cleanPassword) {
      setError({
        message: t.requiredError,
        details:
          "source: auth.login.client | description: email or password was empty before sending the request.",
      });
      return;
    }

    try {
      setLoading(true);

      // 1) Login -> backend sets session cookie
      await authService.login(cleanEmail, cleanPassword);

      // 2) Session-first: confirm current user from /auth/me (source of truth)
      const meRes = await authService.me();
      const user = meRes.data.user;

      // ✅ TS-safe + correct runtime behavior
      if (!user || !user.id) {
        throw new Error(t.sessionConfirmError);
      }

      // Normalize local UI user (UI-only, not auth)
      const payload: LoginData = {
        id: user.id,
        fullName: user.full_name || "User",
        email: user.email || "",
        role: user.role || "student",
      };

      try {
        localStorage.setItem("edu-user", JSON.stringify(payload));
      } catch {
        // ignore (UI-only)
      }

      // ✅ Notify navbar / any listeners so UI flips immediately
      window.dispatchEvent(new Event("auth:changed"));

      // Redirect by role
      redirectByRole(payload.role);
    } catch (err: unknown) {
      setError(toUiError(err, t.genericError));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#F18A68]/10 px-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          {t.title}
        </h1>
        <p className="text-slate-500 text-sm mb-5">{t.subtitle}</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            <p className="font-medium">{error.message}</p>
            {error.details && (
              <p className="mt-1 text-xs text-red-600/90 whitespace-pre-line">
                {error.details}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {t.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-10"
                placeholder={t.passwordPlaceholder}
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-500 hover:text-slate-700 focus:outline-none"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white transition ${
              loading
                ? "bg-emerald-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {loading ? t.buttonLoading : t.button}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => router.push(withLang("/auth/request-reset"))}
            className="hover:text-emerald-600"
          >
            {t.forgot}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push(withLang("/auth/register-parent"))}
            className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            {t.createAccount}
          </button>
          <button
            type="button"
            onClick={() => router.push(withLang("/auth/register-student"))}
            className="rounded-md border border-[#F18A68]/30 px-3 py-2 text-sm font-medium text-[#d95f38] transition hover:bg-[#F18A68]/10"
          >
            {t.createStudent}
          </button>
        </div>

        {t.footerNote && (
          <p className="mt-4 text-center text-[11px] text-slate-400">
            {t.footerNote}
          </p>
        )}
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
