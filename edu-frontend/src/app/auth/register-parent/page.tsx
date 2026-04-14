"use client";

/**
 * Parent Registration Page
 * ----------------------------------------------------------------------------
 * - Multi-step wizard:
 *    1) Parent info + login credentials
 *    2) Children info + interests
 *    3) Review and submit
 *
 * - IMPORTANT (ACCESS LOGIC):
 *   We support exactly two scenarios for children:
 *
 *   1) Student accounts + own email
 *      - Parent chooses: contactPreference = "child"
 *      - Backend creates a user (role="student") for each child,
 *        using the child's own email and password.
 *
 *   2) Parent-only access + same contacts as parent
 *      - Parent chooses: contactPreference = "parent"
 *      - Backend still creates the linked child account.
 *      - Direct child login stays disabled, and communication is sent
 *        to the parent contact details.
 *
 * - CRITICAL POLICIES FOLLOWED:
 *   1. NO userId in dashboard URLs (session-only model)
 *   2. Backend expects only: { parent: {...}, children: [...], contactOption }
 *   3. Password validation matches backend (minimum 8 characters)
 *
 * - ✅ FIXES APPLIED:
 *   1. Replaced raw fetch with apiFetch/authService for consistency
 *   2. Removed undefined fields from JSON payload
 *   3. Updated subjects loader to use apiFetch
 */

import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/src/lib/api";
import { authService } from "@/src/services/authService";

import {
  texts,
  parentRelationships,
  childGenders,
  egyptianSubjects,
  type LangKey,
  type Subject,
  type GradeCatalog,
  type CatalogStage,
  type CatalogLevel,
} from "./registerParentTexts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ChildForm = {
  tempId: string;
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  systemId: string;   // normalized: catalog ID
  stageId: string;    // normalized: catalog ID
  gradeLevelId: string; // normalized: catalog ID (optional)
  relationship: string; // mother / father / guardian
  gender: string; // male / female
  preferredLang: "en" | "ar" | "";
  subjectIds: number[];
};

type ChildValidationErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
};

/** Shape of each child entry in the registration success response. */
type RegisteredChildResult = {
  studentId: number;
  studentUserId: number;
  fullName: string;
  email: string;
  hasOwnLogin: boolean;
  contactType: "individual" | "parent";
  systemId: number | null;
  stageId: number | null;
  gradeLevelId: number | null;
  relationship: string;
  gender: "male" | "female" | null;
  subjectIds: number[];
};

/**
 * Shape of the successful response from
 * POST /auth/register-parent-with-children
 */
type RegisterParentSuccess = {
  success: true;
  message?: string;
  data?: {
    parentUserId?: number;
    parentId?: number;
    parent?: {
      fullName: string;
      email: string;
      phone: string | null;
      preferredLang: string;
    };
    children?: RegisteredChildResult[];
    contactOption?: "individual" | "parent";
  };
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

/** Create a local temporary ID for child forms (not stored in DB). */
const makeTempId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

/** Empty child template for "Add child" */
const createEmptyChild = (): ChildForm => ({
  tempId: makeTempId(),
  fullName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  systemId: "",
  stageId: "",
  gradeLevelId: "",
  relationship: "",
  gender: "",
  preferredLang: "",
  subjectIds: [],
});

/** Simple email validation; returns a key for translated error or null. */
const validateEmail = (email: string): "invalidEmail" | null => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "invalidEmail";
};

/** Password length validation (min 8 chars) - matches backend requirement. */
const validatePassword = (password: string): "passwordTooShort" | null => {
  if (!password) return null;
  return password.length >= 8 ? null : "passwordTooShort";
};

/** Check that password and confirmation match. */
const validatePasswordsMatch = (
  password: string,
  confirmPassword: string
): "passwordsDontMatch" | null => {
  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : "passwordsDontMatch";
};

/* -------------------------------------------------------------------------- */
/* Simple Field Wrapper                                                       */
/* -------------------------------------------------------------------------- */

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
};

/**
 * Generic form field wrapper used throughout the wizard.
 * - Displays a label, the child input/select, and an error line.
 * - Uses a fixed min-height + bottom alignment on the label so that
 *   all controls in the same row line up horizontally even when some
 *   labels wrap onto two lines (e.g. relationship vs grade stage).
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  htmlFor,
}) => (
  <div className="flex h-full flex-col">
    <label
      className="mb-2 flex min-h-10 items-end text-sm font-semibold text-gray-700"
      htmlFor={htmlFor}
    >
      <span>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
    </label>
    {children}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Geometric Background                                                       */
/* -------------------------------------------------------------------------- */

const GeometricShapesBackground: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="animate-float absolute -top-20 -left-20 h-60 w-60 rounded-full bg-[#FF8C42]/20" />
    <div className="animate-float-delayed absolute top-1/4 -right-16 h-40 w-40 rotate-45 bg-[#4ECDC4]/20" />
    <div className="animate-float-slow absolute bottom-1/4 -left-12 h-32 w-32 rotate-12 bg-[#45B7D1]/20" />
    <div className="animate-pulse-slow absolute bottom-20 right-1/4 h-24 w-24 rotate-30 bg-[#96CEB4]/20" />
    <div className="animate-bounce-slow absolute top-1/3 left-1/4 h-20 w-20 rotate-45 bg-[#FFE66D]/20" />
    <div className="animate-spin-slow absolute bottom-1/3 right-20 h-28 w-28 rotate-45 bg-[#FF6B6B]/20" />
    <div className="animate-ping-slow absolute top-10 right-32 h-16 w-16 rounded-full bg-[#FF8C42]/15" />
    <div className="absolute bottom-32 left-32 h-12 w-12 rounded-full bg-[#FF8C42]/15 animate-pulse" />
  </div>
);

/* -------------------------------------------------------------------------- */
/* Subjects Dropdown (per child)                                              */
/* -------------------------------------------------------------------------- */

type SubjectsDropdownProps = {
  subjects: Subject[];
  selectedSubjectIds: number[];
  onSubjectToggle: (subjectId: number) => void;
  lang: LangKey;
  stageId?: string; // catalog stage ID — when set, show all subjects
};

const SubjectsDropdown: React.FC<SubjectsDropdownProps> = ({
  subjects,
  selectedSubjectIds,
  onSubjectToggle,
  lang,
  stageId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const t = texts[lang];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (evt: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(evt.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // Show all subjects once a stage is selected (catalog-level filtering is BE's job)
  const filteredSubjects = useMemo(
    () => (stageId ? subjects : []),
    [subjects, stageId]
  );

  const selectedCount = selectedSubjectIds.length;

  return (
    <div className="space-y-3" ref={dropdownRef}>
      {!stageId && (
        <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-700">
            {lang === "ar"
              ? "يرجى اختيار المرحلة الدراسية أولاً لعرض المواد المتاحة"
              : "Please select grade stage first to view available subjects"}
          </p>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => stageId && setIsOpen((prev) => !prev)}
          disabled={!stageId}
          className={`w-full rounded-xl border-2 text-left text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20 ${
            stageId
              ? "cursor-pointer border-gray-200 bg-white text-gray-900 hover:border-gray-300 focus:border-[#FF8C42]"
              : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span>
              {!stageId
                ? t.subjectsPlaceholder
                : selectedCount === 0
                ? t.subjectsPlaceholder
                : t.selectedSubjects(selectedCount)}
            </span>
            {stageId && (
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </button>

        {isOpen && stageId && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border-2 border-gray-200 bg-white py-2 shadow-lg">
            {filteredSubjects.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                {lang === "ar"
                  ? "لا توجد مواد متاحة لهذه المرحلة"
                  : "No subjects available for this grade"}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {/* Core subjects */}
                {filteredSubjects.some((s) => {
                  const es = egyptianSubjects.find(
                    (cfg) => cfg.id === s.id
                  );
                  return es?.isCore;
                }) && (
                  <div className="border-b border-gray-100 pb-1">
                    <div className="px-4 py-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {lang === "ar" ? "المواد الأساسية" : "Core Subjects"}
                      </span>
                    </div>
                    {filteredSubjects.map((subject) => {
                      const cfg = egyptianSubjects.find(
                        (es) => es.id === subject.id
                      );
                      if (!cfg?.isCore) return null;

                      const isSelected = selectedSubjectIds.includes(
                        subject.id
                      );
                      const label =
                        lang === "ar"
                          ? subject.name_ar || subject.name_en
                          : subject.name_en || subject.name_ar;

                      return (
                        <label
                          key={subject.id}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSubjectToggle(subject.id)}
                            className="h-4 w-4 rounded border-gray-300 text-[#FF8C42] focus:ring-[#FF8C42]"
                          />
                          <span
                            className={
                              isSelected
                                ? "font-medium text-gray-900"
                                : "text-gray-700"
                            }
                          >
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Optional subjects */}
                {filteredSubjects.some((s) => {
                  const es = egyptianSubjects.find(
                    (cfg) => cfg.id === s.id
                  );
                  return !es?.isCore;
                }) && (
                  <div>
                    <div className="px-4 py-2">
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {lang === "ar"
                          ? "المواد الاختيارية"
                          : "Optional Subjects"}
                      </span>
                    </div>
                    {filteredSubjects.map((subject) => {
                      const cfg = egyptianSubjects.find(
                        (es) => es.id === subject.id
                      );
                      if (cfg?.isCore) return null;

                      const isSelected = selectedSubjectIds.includes(
                        subject.id
                      );
                      const label =
                        lang === "ar"
                          ? subject.name_ar || subject.name_en
                          : subject.name_en || subject.name_ar;

                      return (
                        <label
                          key={subject.id}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSubjectToggle(subject.id)}
                            className="h-4 w-4 rounded border-gray-300 text-[#FF8C42] focus:ring-[#FF8C42]"
                          />
                          <span
                            className={
                              isSelected
                                ? "font-medium text-gray-900"
                                : "text-gray-700"
                            }
                          >
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSubjectIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSubjectIds.map((id) => {
            const subject = subjects.find((s) => s.id === id);
            if (!subject) return null;
            const label =
              lang === "ar"
                ? subject.name_ar || subject.name_en
                : subject.name_en || subject.name_ar;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-bg-linearn-100 px-3 py-1 text-xs font-medium text-bg-linearn-800"
              >
                {label}
                <button
                  type="button"
                  onClick={() => onSubjectToggle(id)}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-bg-linearn-200"
                  aria-label="Remove subject"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {stageId && filteredSubjects.length > 0 && (
        <p className="text-xs text-gray-500">
          {lang === "ar"
            ? `عرض ${filteredSubjects.length} مادة متاحة`
            : `Showing ${filteredSubjects.length} available subjects`}
        </p>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

function RegisterParentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang") as LangKey | null;
  const lang: LangKey = langParam === "ar" ? "ar" : "en";
  const t = texts[lang];
  const isRtl = lang === "ar";

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Parent fields
  const [parentFullName, setParentFullName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentPasswordConfirm, setParentPasswordConfirm] = useState("");
  const [parentNotes, setParentNotes] = useState("");

  // Password visibility toggles
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [
    showParentPasswordConfirm,
    setShowParentPasswordConfirm,
  ] = useState(false);

  /**
   * contactPreference drives BOTH:
   * - Who receives notifications
   * - And, more importantly for us:
   *   Whether direct child login is enabled or disabled.
   *
   * "parent" → Child account exists, direct login stays disabled
   * "child"  → Child account exists, direct login is enabled
   */
  const [contactPreference, setContactPreference] = useState<"parent" | "child">(
    "parent"
  );

  // Children list
  const [children, setChildren] = useState<ChildForm[]>([createEmptyChild()]);

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Grade catalog (for child scope selectors)
  const [gradeCatalog, setGradeCatalog] = useState<GradeCatalog | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<{
    parentFullName?: string;
    parentEmail?: string;
    parentPassword?: string;
    parentPasswordConfirm?: string;
    children?: { [tempId: string]: ChildValidationErrors };
  }>({});

  /* ---------------------------------------------------------------------- */
  /* ✅ FIX #3: Load subjects using apiFetch                               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoadingSubjects(true);

        // ✅ Use apiFetch for consistent error handling and session compatibility
        // NOTE: Your backend must expose GET /subjects returning array of subjects
        const data = await apiFetch<unknown>("/subjects");

        let apiSubjects: Subject[] = [];

        if (Array.isArray(data)) {
          apiSubjects = data
            .map((row): Subject | null => {
              if (!row || typeof row !== "object") return null;
              const rec = row as Record<string, unknown>;

              const rawId = rec.id;
              const id =
                typeof rawId === "number"
                  ? rawId
                  : typeof rawId === "string"
                  ? Number(rawId)
                  : NaN;

              if (!Number.isFinite(id)) return null;

              const nameEn =
                (rec.name_en as string | undefined) ??
                (rec.name as string | undefined) ??
                "";

              const nameAr =
                (rec.name_ar as string | undefined) ??
                (rec.name as string | undefined) ??
                "";

              return { id, name_en: nameEn, name_ar: nameAr };
            })
            .filter((s): s is Subject => s !== null);
        }

        if (apiSubjects.length > 0) {
          setSubjects(apiSubjects);
        } else {
          // fallback to local configuration
          setSubjects(
            egyptianSubjects.map((cfg) => ({
              id: cfg.id,
              name_en: cfg.name_en,
              name_ar: cfg.name_ar,
            }))
          );
        }
      } catch {
        // fallback to local configuration
        setSubjects(
          egyptianSubjects.map((cfg) => ({
            id: cfg.id,
            name_en: cfg.name_en,
            name_ar: cfg.name_ar,
          }))
        );
      } finally {
        setLoadingSubjects(false);
      }
    };

    void loadSubjects();

    // Fetch grade catalog (no auth needed — public meta endpoint)
    const loadCatalog = async () => {
      try {
        const body = await apiFetch<{ success: boolean; data: GradeCatalog }>("/meta/grade-catalog");
        if (body?.success && body.data) setGradeCatalog(body.data);
      } catch { /* non-fatal */ }
    };
    void loadCatalog();
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Validation                                                             */
  /* ---------------------------------------------------------------------- */

  const validateStep1 = (): boolean => {
    const errors: {
      parentFullName?: string;
      parentEmail?: string;
      parentPassword?: string;
      parentPasswordConfirm?: string;
    } = {};

    if (!parentFullName.trim()) {
      errors.parentFullName = t.requiredField;
    }

    if (!parentEmail.trim()) {
      errors.parentEmail = t.requiredField;
    } else {
      const emailIssue = validateEmail(parentEmail);
      if (emailIssue) {
        errors.parentEmail = t[emailIssue];
      }
    }

    if (!parentPassword) {
      errors.parentPassword = t.requiredField;
    } else {
      const passIssue = validatePassword(parentPassword);
      if (passIssue) {
        errors.parentPassword = t[passIssue];
      }
    }

    if (!parentPasswordConfirm) {
      errors.parentPasswordConfirm = t.requiredField;
    } else {
      const matchIssue = validatePasswordsMatch(
        parentPassword,
        parentPasswordConfirm
      );
      if (matchIssue) {
        errors.parentPasswordConfirm = t[matchIssue];
      }
    }

    setValidationErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const childErrors: { [tempId: string]: ChildValidationErrors } = {};

    children.forEach((child) => {
      const errorsForChild: ChildValidationErrors = {};

      if (!child.fullName.trim()) {
        errorsForChild.fullName = t.requiredField;
      }

      // If each child has their own contact (individual mode),
      // we must require a valid email for every child.
      if (contactPreference === "child") {
        const trimmedEmail = child.email.trim();
        if (!trimmedEmail) {
          errorsForChild.email = t.requiredField;
        } else {
          const emailIssue = validateEmail(trimmedEmail);
          if (emailIssue) {
            errorsForChild.email = t[emailIssue];
          }
        }

        if (!child.password) {
          errorsForChild.password = t.requiredField;
        } else {
          const passIssue = validatePassword(child.password);
          if (passIssue) {
            errorsForChild.password = t[passIssue];
          }
        }

        if (!child.passwordConfirm) {
          errorsForChild.passwordConfirm = t.requiredField;
        } else {
          const matchIssue = validatePasswordsMatch(
            child.password,
            child.passwordConfirm
          );
          if (matchIssue) {
            errorsForChild.passwordConfirm = t[matchIssue];
          }
        }
      }

      if (
        errorsForChild.fullName ||
        errorsForChild.email ||
        errorsForChild.password ||
        errorsForChild.passwordConfirm
      ) {
        childErrors[child.tempId] = errorsForChild;
      }
    });

    setValidationErrors((prev) => ({ ...prev, children: childErrors }));
    return Object.keys(childErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
        setError(null);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
        setError(null);
      }
    }
  };

  const handleBackStep = () => {
    setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));
    setError(null);
  };

  /* ---------------------------------------------------------------------- */
  /* Children operations                                                    */
  /* ---------------------------------------------------------------------- */

  const updateChild = (tempId: string, patch: Partial<ChildForm>) => {
    setChildren((prev) =>
      prev.map((child) =>
        child.tempId === tempId ? { ...child, ...patch } : child
      )
    );

    // Clear per-child validation errors for fields that are being edited.
    setValidationErrors((prev) => {
      if (!prev.children?.[tempId]) return prev;

      const current = prev.children[tempId];
      const nextChildErrors = { ...current };

      if (patch.fullName !== undefined && nextChildErrors.fullName) {
        nextChildErrors.fullName = undefined;
      }
      if (patch.email !== undefined && nextChildErrors.email) {
        nextChildErrors.email = undefined;
      }
      if (patch.password !== undefined && nextChildErrors.password) {
        nextChildErrors.password = undefined;
      }
      if (patch.password !== undefined && nextChildErrors.passwordConfirm) {
        nextChildErrors.passwordConfirm = undefined;
      }
      if (
        patch.passwordConfirm !== undefined &&
        nextChildErrors.passwordConfirm
      ) {
        nextChildErrors.passwordConfirm = undefined;
      }

      if (
        !nextChildErrors.fullName &&
        !nextChildErrors.email &&
        !nextChildErrors.password &&
        !nextChildErrors.passwordConfirm
      ) {
        const cloneChildren = { ...(prev.children ?? {}) };
        delete cloneChildren[tempId];
        return { ...prev, children: cloneChildren };
      }

      return {
        ...prev,
        children: {
          ...(prev.children ?? {}),
          [tempId]: nextChildErrors,
        },
      };
    });
  };

  const addChild = () => {
    setChildren((prev) => [...prev, createEmptyChild()]);
  };

  const removeChild = (tempId: string) => {
    setChildren((prev) =>
      prev.length === 1 ? prev : prev.filter((c) => c.tempId !== tempId)
    );

    if (validationErrors.children?.[tempId]) {
      const clone = { ...(validationErrors.children ?? {}) };
      delete clone[tempId];
      setValidationErrors((prev) => ({
        ...prev,
        children: clone,
      }));
    }
  };

  const toggleChildSubject = (tempId: string, subjectId: number) => {
    setChildren((prev) =>
      prev.map((child) => {
        if (child.tempId !== tempId) return child;
        const exists = child.subjectIds.includes(subjectId);
        return {
          ...child,
          subjectIds: exists
            ? child.subjectIds.filter((id) => id !== subjectId)
            : [...child.subjectIds, subjectId],
        };
      })
    );
  };

  /* ---------------------------------------------------------------------- */
  /* ✅ FIX #1 & #2: Submit handler using authService                      */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async () => {
    try {
      setError(null);

      const isStep1Valid = validateStep1();
      const isStep2Valid = validateStep2();

      if (!isStep1Valid || !isStep2Valid) {
        setError(isStep1Valid ? t.requiredChildrenError : t.requiredParentError);
        return;
      }

      setSubmitting(true);

      // ✅ Build payload with NO undefined fields
      const parentPreferredLang: "en" | "ar" = lang;

      const contactOption: "parent" | "individual" =
        contactPreference === "child" ? "individual" : "parent";

      // Only include child-owned direct-login credentials when login is enabled.
      const childrenPayload = children.map((c) => {
        const trimmedEmail = c.email.trim();

        const baseChild = {
          fullName: c.fullName.trim(),
          systemId: c.systemId ? Number(c.systemId) : null,
          stageId: c.stageId ? Number(c.stageId) : null,
          gradeLevelId: c.gradeLevelId ? Number(c.gradeLevelId) : null,
          relationship: c.relationship.trim() || "mother",
          gender: c.gender.trim() || null,
          preferredLang: (c.preferredLang || parentPreferredLang) as "en" | "ar",
          subjectIds: c.subjectIds,
        };

        if (contactOption === "individual") {
          return {
            ...baseChild,
            email: trimmedEmail,
            password: c.password,
          };
        }

        // Parent-only mode: do not send child login email.
        return {
          ...baseChild,
        };
      });

      const payload = {
        parent: {
          fullName: parentFullName.trim(),
          email: parentEmail.trim(),
          password: parentPassword.trim(),
          phone: parentPhone.trim() || null,
          preferredLang: parentPreferredLang,
          notes:
            parentNotes.trim().length > 0
              ? `[Contact: ${contactPreference}] ${parentNotes.trim()}`
              : `[Contact: ${contactPreference}]`,
        },
        children: childrenPayload,
        contactOption,
      };

      try {
        // ✅ Use service (apiFetch underneath) — consistent with session-first backend
        const data = await authService.registerParentWithChildren(payload);

        // Your backend uses {success, message, data}
        // authService.registerParentWithChildren returns whatever apiFetch returns.
        // If you want typed handling:
        const resp = data as RegisterParentSuccess;

        const me = await authService.me();
        const user = me.data.user;
        if (!user || user.role.toLowerCase() !== "parent") {
          throw new Error("Unable to confirm parent session after registration.");
        }

        try {
          localStorage.setItem(
            "edu-user",
            JSON.stringify({
              id: user.id,
              fullName: user.full_name || parentFullName.trim(),
              email: user.email || parentEmail.trim(),
              role: user.role || "parent",
            })
          );
        } catch {
          // Ignore UI-only persistence failures.
        }

        window.dispatchEvent(new Event("auth:changed"));
        setSuccessMsg(resp.message ?? t.successFallback);

        setTimeout(() => {
          router.push(lang === "ar" ? "/parent/dashboard?lang=ar" : "/parent/dashboard");
        }, 1200);

        return;
      } catch (err: unknown) {
        console.error("Registration error:", err);
        setError(getErrorMessage(err) || t.genericError);
        return;
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err) || t.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  const passwordInputPaddingClass = isRtl ? "pl-10" : "pr-10";
  const passwordTogglePositionClass = isRtl ? "left-3" : "right-3";

  // Localised labels for the eye icon (no dependency on texts object)
  const showPasswordLabel = isRtl ? "إظهار كلمة المرور" : "Show password";
  const hidePasswordLabel = isRtl ? "إخفاء كلمة المرور" : "Hide password";

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-[#FFE8D6] via-[#FFD1B0] to-[#FFB38A] p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Animated background keyframes (global) */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) rotate(45deg);
          }
          50% {
            transform: translateY(-15px) rotate(55deg);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) rotate(12deg);
          }
          50% {
            transform: translateY(-10px) rotate(22deg);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0) rotate(45deg);
          }
          50% {
            transform: translateY(-10px) rotate(45deg);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 3s ease-in-out infinite;
        }
      `}</style>

      <GeometricShapesBackground />

      {/* Card is constrained to viewport height; content scrolls inside if needed */}
      <div className="relative z-10 w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-sm">
        {/* Header / Steps */}
        <div className="bg-linear-to-r from-[#FF8C42] to-[#FF6B35] p-6 text-white">
          <h1 className="text-center text-3xl font-bold drop-shadow-sm">
            {t.pageTitle}
          </h1>

          <div className="mt-6 flex items-center justify-center gap-4">
            {[1, 2, 3].map((s, idx) => {
              const active = step === s;
              const completed = step > s;
              return (
                <React.Fragment key={s}>
                  {idx > 0 && (
                    <div
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        completed ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                        active
                          ? "scale-110 bg-white text-[#FF6B35] shadow-lg"
                          : completed
                          ? "bg-white text-[#FF6B35] shadow-md"
                          : "bg-white/30 text-white shadow-sm"
                      }`}
                    >
                      {completed ? "✓" : s}
                    </div>
                    <span className="text-xs font-medium text-white/90">
                      {t.stepsLabel[idx]}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 rounded-2xl border border-bg-linearn-200 bg-bg-linearn-50 px-4 py-3 text-sm text-bg-linearn-700 shadow-sm">
              {successMsg}
            </div>
          )}

          {/* STEP 1: Parent info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-center text-2xl font-bold text-gray-800">
                {t.step1Title}
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label={t.parentFullName}
                  required
                  error={validationErrors.parentFullName}
                  htmlFor="parentFullName"
                >
                  <input
                    id="parentFullName"
                    value={parentFullName}
                    onChange={(e) => {
                      setParentFullName(e.target.value);
                      if (validationErrors.parentFullName) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          parentFullName: undefined,
                        }));
                      }
                    }}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                    placeholder={t.parentFullNamePlaceholder}
                  />
                </FormField>

                <FormField
                  label={t.parentEmail}
                  required
                  error={validationErrors.parentEmail}
                  htmlFor="parentEmail"
                >
                  <input
                    id="parentEmail"
                    type="email"
                    autoComplete="email"
                    value={parentEmail}
                    onChange={(e) => {
                      setParentEmail(e.target.value);
                      if (validationErrors.parentEmail) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          parentEmail: undefined,
                        }));
                      }
                    }}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                    placeholder={t.parentEmailPlaceholder}
                  />
                </FormField>
              </div>

              <FormField label={t.parentPhone} htmlFor="parentPhone">
                <input
                  id="parentPhone"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                  placeholder={t.parentPhonePlaceholder}
                />
              </FormField>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Password with eye toggle */}
                <FormField
                  label={t.parentPassword}
                  required
                  error={validationErrors.parentPassword}
                  htmlFor="parentPassword"
                >
                  <div className="relative">
                    <input
                      id="parentPassword"
                      type={showParentPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={parentPassword}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setParentPassword(newVal);
                        if (validationErrors.parentPassword) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            parentPassword: undefined,
                          }));
                        }

                        if (
                          validationErrors.parentPasswordConfirm &&
                          parentPasswordConfirm
                        ) {
                          const issue = validatePasswordsMatch(
                            newVal,
                            parentPasswordConfirm
                          );
                          if (!issue) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              parentPasswordConfirm: undefined,
                            }));
                          }
                        }
                      }}
                      className={`block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20 ${passwordInputPaddingClass}`}
                      placeholder={t.parentPasswordPlaceholder}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowParentPassword((prevVisible) => !prevVisible)
                      }
                      className={`absolute inset-y-0 ${passwordTogglePositionClass} flex items-center text-gray-400 hover:text-gray-600`}
                      aria-label={
                        showParentPassword ? hidePasswordLabel : showPasswordLabel
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d={
                            showParentPassword
                              ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.5 0-8.268-2.943-9.543-7 .28-.9.693-1.747 1.225-2.515M6.228 6.228A9.956 9.956 0 0112 5c4.5 0 8.268 2.943 9.543 7-.34 1.091-.86 2.11-1.53 3.016M3 3l18 18"
                              : "M2.458 12C3.732 7.943 7.5 5 12 5c4.5 0 8.268 2.943 9.543 7-1.275 4.057-5.043 7-9.543 7-4.5 0-8.268-2.943-9.543-7z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          }
                        />
                      </svg>
                    </button>
                  </div>
                </FormField>

                {/* Confirm password with eye toggle */}
                <FormField
                  label={t.parentPasswordConfirm}
                  required
                  error={validationErrors.parentPasswordConfirm}
                  htmlFor="parentPasswordConfirm"
                >
                  <div className="relative">
                    <input
                      id="parentPasswordConfirm"
                      type={showParentPasswordConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={parentPasswordConfirm}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setParentPasswordConfirm(newVal);
                        if (validationErrors.parentPasswordConfirm) {
                          const issue = validatePasswordsMatch(
                            parentPassword,
                            newVal
                          );
                          if (!issue) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              parentPasswordConfirm: undefined,
                            }));
                          }
                        }
                      }}
                      className={`block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20 ${passwordInputPaddingClass}`}
                      placeholder={t.parentPasswordConfirmPlaceholder}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowParentPasswordConfirm(
                          (prevVisible) => !prevVisible
                        )
                      }
                      className={`absolute inset-y-0 ${passwordTogglePositionClass} flex items-center text-gray-400 hover:text-gray-600`}
                      aria-label={
                        showParentPasswordConfirm
                          ? hidePasswordLabel
                          : showPasswordLabel
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d={
                            showParentPasswordConfirm
                              ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.5 0-8.268-2.943-9.543-7 .28-.9.693-1.747 1.225-2.515M6.228 6.228A9.956 9.956 0 0112 5c4.5 0 8.268 2.943 9.543 7-.34 1.091-.86 2.11-1.53 3.016M3 3l18 18"
                              : "M2.458 12C3.732 7.943 7.5 5 12 5c4.5 0 8.268 2.943 9.543 7-1.275 4.057-5.043 7-9.543 7-4.5 0-8.268-2.943-9.543-7z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          }
                        />
                      </svg>
                    </button>
                  </div>
                </FormField>
              </div>

              {/* Contact preference → drives access scenario */}
              <div className="rounded-2xl border-2 border-blue-100 bg-linear-to-r from-blue-50 to-purple-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  {t.contactPreferenceLabel}
                </p>
                <div className="flex flex-col gap-3 text-sm text-gray-600">
                  {/* Option: Keep direct child login disabled */}
                  <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent bg-white p-3 shadow-sm transition-all hover:border-blue-200">
                    <input
                      type="radio"
                      className="h-4 w-4 text-[#FF8C42]"
                      checked={contactPreference === "parent"}
                      onChange={() => setContactPreference("parent")}
                    />
                    <span>{t.contactOptionParent}</span>
                  </label>

                  {/* Option: Enable direct child login + use child contacts */}
                  <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent bg-white p-3 shadow-sm transition-all hover:border-blue-200">
                    <input
                      type="radio"
                      className="h-4 w-4 text-[#FF8C42]"
                      checked={contactPreference === "child"}
                      onChange={() => setContactPreference("child")}
                    />
                    <div>
                      <span>{t.contactOptionOwn}</span>
                      <p className="mt-1 text-xs text-gray-500">
                        {t.contactOptionNote}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <FormField label={t.notesLabel} htmlFor="parentNotes">
                <textarea
                  id="parentNotes"
                  rows={3}
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                  placeholder={t.notesPlaceholder}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4">
                {/* ✅ FIXED: Cancel button now navigates to login page */}
                <button
                  type="button"
                  onClick={() => router.push(lang === "ar" ? "/auth/login?lang=ar" : "/auth/login")}
                  className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-xl bg-linear-to-r from-[#FF8C42] to-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                >
                  {t.next}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Children */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-center text-2xl font-bold text-gray-800">
                {t.step2Title}
              </h2>
              <p className="mb-6 text-center text-sm text-gray-600">
                {t.childrenIntro}
              </p>

              <div className="space-y-6">
                {children.map((child, index) => (
                  <div
                    key={child.tempId}
                    className="rounded-2xl border-2 border-bg-linearn-100 bg-linear-to-br from-bg-linearn-50/70 to-emerald-50/70 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <p className="text-lg font-bold text-bg-linearn-800">
                        {t.childCardTitle(index)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeChild(child.tempId)}
                        disabled={children.length === 1}
                        className={`text-sm font-semibold ${
                          children.length === 1
                            ? "cursor-not-allowed text-gray-400"
                            : "text-red-500 transition-all hover:text-red-700 hover:underline"
                        }`}
                      >
                        {t.removeChild}
                      </button>
                    </div>

                    {/* First row: name + direct-login credentials when enabled */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        label={t.childName}
                        required
                        error={
                          validationErrors.children?.[child.tempId]?.fullName
                        }
                        htmlFor={`childName-${child.tempId}`}
                      >
                        <input
                          id={`childName-${child.tempId}`}
                          value={child.fullName}
                          onChange={(e) =>
                            updateChild(child.tempId, {
                              fullName: e.target.value,
                            })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                          placeholder={t.childNamePlaceholder}
                        />
                      </FormField>

                      {/* Child contact fields are shown only when
                          direct child login is enabled for this child flow */}
                      {contactPreference === "child" && (
                        <>
                          <FormField
                            label={t.childEmail}
                            required
                            error={
                              validationErrors.children?.[child.tempId]?.email
                            }
                            htmlFor={`childEmail-${child.tempId}`}
                          >
                            <input
                              id={`childEmail-${child.tempId}`}
                              type="email"
                              value={child.email}
                              onChange={(e) =>
                                updateChild(child.tempId, {
                                  email: e.target.value,
                                })
                              }
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                              placeholder={t.childEmailPlaceholder}
                            />
                          </FormField>

                          <FormField
                            label={t.childPassword}
                            required
                            error={
                              validationErrors.children?.[child.tempId]?.password
                            }
                            htmlFor={`childPassword-${child.tempId}`}
                          >
                            <input
                              id={`childPassword-${child.tempId}`}
                              type="password"
                              autoComplete="new-password"
                              value={child.password}
                              onChange={(e) =>
                                updateChild(child.tempId, {
                                  password: e.target.value,
                                })
                              }
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                              placeholder={t.childPasswordPlaceholder}
                            />
                          </FormField>

                          <FormField
                            label={t.childPasswordConfirm}
                            required
                            error={
                              validationErrors.children?.[child.tempId]?.passwordConfirm
                            }
                            htmlFor={`childPasswordConfirm-${child.tempId}`}
                          >
                            <input
                              id={`childPasswordConfirm-${child.tempId}`}
                              type="password"
                              autoComplete="new-password"
                              value={child.passwordConfirm}
                              onChange={(e) =>
                                updateChild(child.tempId, {
                                  passwordConfirm: e.target.value,
                                })
                              }
                              className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                              placeholder={t.childPasswordConfirmPlaceholder}
                            />
                          </FormField>
                        </>
                      )}
                    </div>

                    {/* Second row: System | Stage | Grade level | Relationship | Gender */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Education system */}
                      <FormField label={t.childSystem} htmlFor={`systemId-${child.tempId}`}>
                        <select
                          id={`systemId-${child.tempId}`}
                          value={child.systemId}
                          onChange={(e) =>
                            updateChild(child.tempId, { systemId: e.target.value, stageId: "", gradeLevelId: "" })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                        >
                          <option value="">{t.childSystemPlaceholder}</option>
                          {(gradeCatalog?.systems ?? []).map((sys) => (
                            <option key={sys.id} value={String(sys.id)}>{sys.name}</option>
                          ))}
                        </select>
                      </FormField>

                      {/* Stage */}
                      <FormField label={t.childStage} htmlFor={`stageId-${child.tempId}`}>
                        <select
                          id={`stageId-${child.tempId}`}
                          value={child.stageId}
                          disabled={!child.systemId}
                          onChange={(e) =>
                            updateChild(child.tempId, { stageId: e.target.value, gradeLevelId: "" })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all disabled:bg-gray-50 disabled:text-gray-400 focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                        >
                          <option value="">{t.childStagePlaceholder}</option>
                          {(gradeCatalog?.stages ?? [])
                            .filter((st: CatalogStage) => st.systemId === Number(child.systemId))
                            .map((st: CatalogStage) => (
                              <option key={st.id} value={String(st.id)}>
                                {lang === "ar" ? (st.nameAr || st.nameEn) : (st.nameEn || st.nameAr)}
                              </option>
                            ))}
                        </select>
                      </FormField>

                      {/* Grade level */}
                      <FormField label={t.childGradeLevel} htmlFor={`gradeLevelId-${child.tempId}`}>
                        <select
                          id={`gradeLevelId-${child.tempId}`}
                          value={child.gradeLevelId}
                          disabled={!child.stageId}
                          onChange={(e) =>
                            updateChild(child.tempId, { gradeLevelId: e.target.value })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all disabled:bg-gray-50 disabled:text-gray-400 focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                        >
                          <option value="">{t.childGradeLevelPlaceholder}</option>
                          {(gradeCatalog?.levels ?? [])
                            .filter((lv: CatalogLevel) => lv.stageId === Number(child.stageId))
                            .map((lv: CatalogLevel) => (
                              <option key={lv.id} value={String(lv.id)}>
                                {lang === "ar" ? (lv.nameAr || lv.nameEn) : (lv.nameEn || lv.nameAr)}
                              </option>
                            ))}
                        </select>
                      </FormField>
                    </div>

                    {/* Third row: Relationship | Gender */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <FormField
                        label={t.relationship}
                        htmlFor={`relationship-${child.tempId}`}
                      >
                        <select
                          id={`relationship-${child.tempId}`}
                          value={child.relationship}
                          onChange={(e) =>
                            updateChild(child.tempId, {
                              relationship: e.target.value,
                            })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                        >
                          <option value="">
                            {t.relationshipPlaceholder}
                          </option>
                          {parentRelationships[lang].map((rel) => (
                            <option key={rel.value} value={rel.value}>
                              {rel.label}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField
                        label={t.childGender}
                        htmlFor={`gender-${child.tempId}`}
                      >
                        <select
                          id={`gender-${child.tempId}`}
                          value={child.gender}
                          onChange={(e) =>
                            updateChild(child.tempId, {
                              gender: e.target.value,
                            })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                        >
                          <option value="">
                            {t.childGenderPlaceholder}
                          </option>
                          {childGenders[lang].map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>

                    {/* Preferred language */}
                    <div className="mt-4">
                      <FormField
                        label={t.childPreferredLang}
                        htmlFor={`preferredLang-${child.tempId}`}
                      >
                        <select
                          id={`preferredLang-${child.tempId}`}
                          value={child.preferredLang}
                          onChange={(e) =>
                            updateChild(child.tempId, {
                              preferredLang: e.target
                                .value as ChildForm["preferredLang"],
                            })
                          }
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#FF8C42] focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/20"
                        >
                          <option value="">
                            {t.childPreferredLangUnset}
                          </option>
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                      </FormField>
                    </div>

                    {/* Subjects */}
                    <div className="mt-4">
                      <FormField label={t.subjectsLabel}>
                        {loadingSubjects ? (
                          <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                            {t.loadingSubjects}
                          </div>
                        ) : (
                          <SubjectsDropdown
                            subjects={subjects}
                            selectedSubjectIds={child.subjectIds}
                            onSubjectToggle={(id) =>
                              toggleChildSubject(child.tempId, id)
                            }
                            lang={lang}
                            stageId={child.stageId}
                          />
                        )}
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addChild}
                className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-bg-linearn-400 bg-bg-linearn-50 px-6 py-3 text-sm font-semibold text-bg-linearn-700 transition-all hover:bg-bg-linearn-100"
              >
                <span className="text-lg">+</span>
                {t.addChild}
              </button>

              <div className="flex justify-between gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-xl bg-linear-to-r from-[#FF8C42] to-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                >
                  {t.next}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & confirm */}
          {step === 3 && (
            <div className="space-y-6 rounded-3xl bg-gray-50/50 p-6">
              <h2 className="text-center text-2xl font-bold text-gray-800">
                {t.step3Title}
              </h2>

              <div className="rounded-2xl border-2 border-gray-200 bg-gray-100 p-6 text-sm text-gray-600">
                <p className="text-center font-semibold">{t.step3Intro}</p>
              </div>

              {/* Parent summary */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-xl font-bold text-gray-800">
                  {t.reviewParentSection}
                </h3>
                <dl className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <dt className="font-semibold text-gray-700">
                      {t.parentFullName}
                    </dt>
                    <dd className="mt-1">{parentFullName || "-"}</dd>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <dt className="font-semibold text-gray-700">
                      {t.parentEmail}
                    </dt>
                    <dd className="mt-1">{parentEmail || "-"}</dd>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <dt className="font-semibold text-gray-700">
                      {t.parentPhone}
                    </dt>
                    <dd className="mt-1">{parentPhone || "-"}</dd>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <dt className="font-semibold text-gray-700">
                      {t.contactPreferenceLabel}
                    </dt>
                    <dd className="mt-1">
                      {contactPreference === "parent"
                        ? t.contactOptionParent
                        : t.contactOptionOwn}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Children summary */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-xl font-bold text-gray-800">
                  {t.reviewChildrenSection}
                </h3>

                <div className="space-y-4 text-sm text-gray-600">
                  {children.map((c, idx) => {
                    const interestLabels = c.subjectIds
                      .map((id) => subjects.find((s) => s.id === id))
                      .filter((s): s is Subject => Boolean(s))
                      .map((s) =>
                        lang === "ar"
                          ? s.name_ar || s.name_en
                          : s.name_en || s.name_ar
                      );

                    return (
                      <div
                        key={c.tempId}
                        className="rounded-xl border-2 border-gray-100 bg-gray-50 p-4 shadow-sm"
                      >
                        <p className="mb-3 text-lg font-bold text-gray-800">
                          {t.childCardTitle(idx)} – {c.fullName || "-"}
                        </p>
                        <dl className="grid gap-3 md:grid-cols-2">
                          {contactPreference === "child" && (
                            <div>
                              <dt className="font-semibold text-gray-700">
                                {t.childEmail}
                              </dt>
                              <dd className="mt-1">{c.email || "-"}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="font-semibold text-gray-700">
                              {t.relationship}
                            </dt>
                            <dd className="mt-1">
                              {parentRelationships[lang].find(
                                (r) => r.value === c.relationship
                              )?.label || "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-700">
                              {t.childGender}
                            </dt>
                            <dd className="mt-1">
                              {childGenders[lang].find(
                                (g) => g.value === c.gender
                              )?.label || "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-700">
                              {t.childStage}
                            </dt>
                            <dd className="mt-1">
                              {(() => {
                                const st = gradeCatalog?.stages.find((s) => String(s.id) === c.stageId);
                                if (!st) return "-";
                                return lang === "ar" ? (st.nameAr || st.nameEn) : (st.nameEn || st.nameAr);
                              })()}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-700">
                              {t.childGradeLevel}
                            </dt>
                            <dd className="mt-1">
                              {(() => {
                                if (!c.gradeLevelId) return "-";
                                const lv = gradeCatalog?.levels.find((l) => String(l.id) === c.gradeLevelId);
                                if (!lv) return "-";
                                return lang === "ar" ? (lv.nameAr || lv.nameEn) : (lv.nameEn || lv.nameAr);
                              })()}
                            </dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="font-semibold text-gray-700">
                              {t.interestsLabel}
                            </dt>
                            <dd className="mt-1 flex flex-wrap gap-2">
                              {interestLabels.length > 0 ? (
                                interestLabels.map((label, i) => (
                                  <span
                                    key={i}
                                    className="inline-block rounded-full bg-bg-linearn-100 px-3 py-1 text-xs font-medium text-bg-linearn-800"
                                  >
                                    {label}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all ${
                    submitting
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-linear-to-r from-green-500 to-emerald-500 hover:scale-105 hover:shadow-lg"
                  }`}
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterParentPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  );
}

export default function RegisterParentPage() {
  return (
    <Suspense fallback={<RegisterParentPageFallback />}>
      <RegisterParentPageContent />
    </Suspense>
  );
}
