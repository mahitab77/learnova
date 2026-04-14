"use client";

import React, {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/src/lib/api";
import {
  authService,
  type RegisterStudentPayload,
} from "@/src/services/authService";
import {
  registerStudentTexts,
  type CatalogLevel,
  type CatalogStage,
  type GradeCatalog,
  type LangKey,
} from "./registerStudentTexts";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredLang: "ar" | "en";
  systemId: string;
  stageId: string;
  gradeLevelId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type UiUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

function withLang(path: string, lang: LangKey) {
  return lang === "ar" ? `${path}?lang=ar` : path;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (isRecord(err) && typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-xs font-medium text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function RegisterStudentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: LangKey = searchParams.get("lang") === "ar" ? "ar" : "en";
  const isRtl = lang === "ar";
  const t = registerStudentTexts[lang];

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredLang: lang,
    systemId: "",
    stageId: "",
    gradeLevelId: "",
  });
  const [catalog, setCatalog] = useState<GradeCatalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        setCatalogError(null);
        const response = await apiFetch<{ success: boolean; data: GradeCatalog }>(
          "/meta/grade-catalog",
          { method: "GET", cache: "no-store" }
        );

        if (!cancelled && response?.success && response.data) {
          setCatalog(response.data);
        }
      } catch {
        if (!cancelled) {
          setCatalogError(t.catalogError);
        }
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [t.catalogError]);

  const stageOptions = useMemo(
    () =>
      (catalog?.stages ?? []).filter(
        (stage: CatalogStage) => stage.systemId === Number(form.systemId)
      ),
    [catalog, form.systemId]
  );

  const levelOptions = useMemo(
    () =>
      (catalog?.levels ?? []).filter(
        (level: CatalogLevel) => level.stageId === Number(form.stageId)
      ),
    [catalog, form.stageId]
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setError(null);
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = t.requiredField;
    if (!form.email.trim()) nextErrors.email = t.requiredField;
    else if (!isValidEmail(form.email.trim())) nextErrors.email = t.invalidEmail;

    if (!form.password) nextErrors.password = t.requiredField;
    else if (form.password.length < 8) nextErrors.password = t.passwordTooShort;

    if (!form.confirmPassword) nextErrors.confirmPassword = t.requiredField;
    else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = t.passwordsDontMatch;
    }

    if (!form.systemId) nextErrors.systemId = t.systemRequired;
    if (!form.stageId) nextErrors.stageId = t.stageRequired;

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload: RegisterStudentPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      preferredLang: form.preferredLang,
      systemId: Number(form.systemId),
      stageId: Number(form.stageId),
      gradeLevelId: form.gradeLevelId ? Number(form.gradeLevelId) : null,
    };

    try {
      setSubmitting(true);
      setError(null);

      await authService.registerStudent(payload);

      const me = await authService.me();
      const user = me.data.user;

      if (!user || user.role.toLowerCase() !== "student") {
        throw new Error(t.sessionConfirmError);
      }

      const uiUser: UiUser = {
        id: user.id,
        fullName: user.full_name || payload.fullName,
        email: user.email || payload.email,
        role: user.role || "student",
      };

      try {
        localStorage.setItem("edu-user", JSON.stringify(uiUser));
      } catch {
        // ignore UI-only persistence failures
      }

      window.dispatchEvent(new Event("auth:changed"));
      router.push(withLang("/student/onboarding", lang));
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.genericError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#fff7ef_0%,#fff2e3_35%,#ffe6d1_100%)] px-4 py-10"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] bg-[#F18A68] p-8 text-white shadow-[0_30px_80px_rgba(241,138,104,0.28)]">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
            LearnNova
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight">{t.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">{t.subtitle}</p>

          <div className="mt-8 rounded-3xl bg-white/12 p-5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-white">{t.pathNoteTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-white/80">{t.pathNoteBody}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push(withLang("/auth/register-parent", lang))}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#d95f38] transition hover:bg-white/90"
              >
                {t.createParent}
              </button>
              <button
                type="button"
                onClick={() => router.push(withLang("/auth/register-teacher", lang))}
                className="rounded-full border border-white/35 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t.teacherApply}
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-[#111624]/16 p-5">
            <p className="text-sm font-semibold">{t.alreadyHaveAccount}</p>
            <button
              type="button"
              onClick={() => router.push(withLang("/auth/login", lang))}
              className="mt-3 inline-flex rounded-full bg-[#A2BF00] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8ba500]"
            >
              {t.signIn}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-[0_20px_70px_rgba(17,22,36,0.08)]">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {catalogError && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {catalogError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label={t.fullNameLabel}
                htmlFor="fullName"
                required
                error={fieldErrors.fullName}
              >
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  placeholder={t.fullNamePlaceholder}
                />
              </FormField>

              <FormField
                label={t.emailLabel}
                htmlFor="email"
                required
                error={fieldErrors.email}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  placeholder={t.emailPlaceholder}
                />
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label={t.passwordLabel}
                htmlFor="password"
                required
                error={fieldErrors.password}
              >
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  placeholder={t.passwordPlaceholder}
                />
              </FormField>

              <FormField
                label={t.confirmPasswordLabel}
                htmlFor="confirmPassword"
                required
                error={fieldErrors.confirmPassword}
              >
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  placeholder={t.confirmPasswordPlaceholder}
                />
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label={t.preferredLangLabel}
                htmlFor="preferredLang"
              >
                <select
                  id="preferredLang"
                  value={form.preferredLang}
                  onChange={(event) =>
                    updateField("preferredLang", event.target.value as "ar" | "en")
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                >
                  <option value="ar">{t.languageArabic}</option>
                  <option value="en">{t.languageEnglish}</option>
                </select>
              </FormField>
            </div>

            <div className="rounded-3xl bg-slate-50/90 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t.systemLabel} / {t.stageLabel} / {t.gradeLevelLabel}
                </h2>
                {loadingCatalog && (
                  <span className="text-xs font-medium text-slate-500">
                    {t.catalogLoading}
                  </span>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <FormField
                  label={t.systemLabel}
                  htmlFor="systemId"
                  required
                  error={fieldErrors.systemId}
                >
                  <select
                    id="systemId"
                    value={form.systemId}
                    onChange={(event) => {
                      const nextSystemId = event.target.value;
                      setForm((prev) => ({
                        ...prev,
                        systemId: nextSystemId,
                        stageId: "",
                        gradeLevelId: "",
                      }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        systemId: undefined,
                        stageId: undefined,
                        gradeLevelId: undefined,
                      }));
                      setError(null);
                    }}
                    disabled={loadingCatalog || !catalog}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  >
                    <option value="">{t.systemPlaceholder}</option>
                    {(catalog?.systems ?? []).map((system) => (
                      <option key={system.id} value={String(system.id)}>
                        {system.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label={t.stageLabel}
                  htmlFor="stageId"
                  required
                  error={fieldErrors.stageId}
                >
                  <select
                    id="stageId"
                    value={form.stageId}
                    onChange={(event) => {
                      const nextStageId = event.target.value;
                      setForm((prev) => ({
                        ...prev,
                        stageId: nextStageId,
                        gradeLevelId: "",
                      }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        stageId: undefined,
                        gradeLevelId: undefined,
                      }));
                      setError(null);
                    }}
                    disabled={!form.systemId}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  >
                    <option value="">{t.stagePlaceholder}</option>
                    {stageOptions.map((stage) => (
                      <option key={stage.id} value={String(stage.id)}>
                        {lang === "ar" ? stage.nameAr || stage.nameEn : stage.nameEn || stage.nameAr}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label={t.gradeLevelLabel}
                  htmlFor="gradeLevelId"
                  error={fieldErrors.gradeLevelId}
                  hint={t.optionalLabel}
                >
                  <select
                    id="gradeLevelId"
                    value={form.gradeLevelId}
                    onChange={(event) => updateField("gradeLevelId", event.target.value)}
                    disabled={!form.stageId}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#F18A68] focus:ring-2 focus:ring-[#F18A68]/20"
                  >
                    <option value="">{t.gradeLevelPlaceholder}</option>
                    {levelOptions.map((level) => (
                      <option key={level.id} value={String(level.id)}>
                        {lang === "ar" ? level.nameAr || level.nameEn : level.nameEn || level.nameAr}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loadingCatalog || Boolean(catalogError)}
              className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                submitting || loadingCatalog || Boolean(catalogError)
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-[#A2BF00] hover:bg-[#8ba500]"
              }`}
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function RegisterStudentPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  );
}

export default function RegisterStudentPage() {
  return (
    <Suspense fallback={<RegisterStudentPageFallback />}>
      <RegisterStudentPageContent />
    </Suspense>
  );
}
