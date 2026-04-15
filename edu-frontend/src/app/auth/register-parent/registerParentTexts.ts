// src/app/auth/register-parent/registerParentTexts.ts

// -----------------------------------------------------------------------------
// Shared Types
// -----------------------------------------------------------------------------
export type LangKey = "en" | "ar";

// Grade catalog types returned by GET /meta/grade-catalog
export type CatalogSystem = { id: number; name: string; code: string };
export type CatalogStage  = { id: number; systemId: number; nameEn: string; nameAr: string; code: string };
export type CatalogLevel  = { id: number; stageId: number; nameEn: string; nameAr: string; code: string };
export type GradeCatalog  = { systems: CatalogSystem[]; stages: CatalogStage[]; levels: CatalogLevel[] };

export type Subject = {
  id: number;
  name_en: string;
  name_ar: string;
};

// -----------------------------------------------------------------------------
// i18n Texts (UI strings only, no logic)
// -----------------------------------------------------------------------------
export const texts = {
  en: {
    pageTitle: "Parent Registration",
    stepsLabel: ["Parent info", "Children", "Review & confirm"] as const,
    step1Title: "Step 1 – Parent information",
    step2Title: "Step 2 – Children details",
    step3Title: "Step 3 – Review & confirm",
    step3Intro: "Review all details before we create the accounts.",

    parentFullName: "Parent full name",
    parentFullNamePlaceholder: "e.g. Sarah Ahmed",
    parentEmail: "Parent email",
    parentEmailPlaceholder: "parent@example.com",
    parentPhone: "Parent phone (for contact / payments)",
    parentPhonePlaceholder: "+20...",
    parentPassword: "Password",
    parentPasswordPlaceholder: "••••••••",
    parentPasswordConfirm: "Confirm password",
    parentPasswordConfirmPlaceholder: "Repeat password",

    contactPreferenceLabel: "How should we contact your children?",
    contactOptionParent:
      "Use my (parent) contact details and keep direct child login disabled",
    contactOptionOwn:
      "Use each child's own email and enable direct login",
    contactOptionNote:
      "Each child still gets a linked account. If direct login is enabled, you'll provide that child's email and password in the next step.",
    notesLabel: "Notes for admissions team (optional)",
    notesPlaceholder:
      "Any special notes about schedules, learning needs, etc.",

    childrenIntro:
      "Add each child who will use LearnNova. You can add more later from the parent dashboard.",
    childCardTitle: (index: number) => `Child ${index + 1}`,
    addChild: "Add another child",
    removeChild: "Remove",
    childName: "Child full name",
    childNamePlaceholder: "e.g. Omar Ali",
    childEmail: "Child email for direct login",
    childEmailPlaceholder: "child@example.com",
    childPassword: "Child password for direct login",
    childPasswordPlaceholder: "••••••••",
    childPasswordConfirm: "Confirm child password",
    childPasswordConfirmPlaceholder: "Repeat child password",
    childSystem: "Education system",
    childSystemPlaceholder: "Select system…",
    childStage: "Stage",
    childStagePlaceholder: "Select stage…",
    childGradeLevel: "Grade level",
    childGradeLevelPlaceholder: "Select grade…",
    loadingGradeCatalog: "Loading grades…",
    relationship: "Relationship to this child",
    relationshipPlaceholder: "Select relationship",
    childGender: "Child gender",
    childGenderPlaceholder: "Select gender",
    childPreferredLang: "Preferred language for this child",
    childPreferredLangUnset: "Same as parent",

    subjectsLabel: "Select Subjects",
    subjectsPlaceholder: "Choose subjects your child needs help with",
    subjectsIntro:
      "For each child, you can optionally mark the subjects they need help with. This is for planning only.",
    loadingSubjects: "Loading subjects...",
    noSubjects: "No subjects configured yet.",
    selectedSubjects: (count: number) =>
      `${count} subject${count !== 1 ? "s" : ""} selected`,

    reviewParentSection: "Parent",
    reviewChildrenSection: "Children",
    interestsLabel: "Requested subjects",

    // Validation messages
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 8 characters",
    passwordsDontMatch: "Passwords do not match",
    requiredParentError:
      "Parent full name, email and password are required, and passwords must match.",
    requiredChildrenError:
      "Please complete each child entry. When direct login is enabled, each child also needs an email and password.",

    genericError:
      "Something went wrong while registering. Please try again.",
    next: "Next",
    back: "Back",
    cancel: "Cancel",
    submit: "Create parent & children accounts",
    submitting: "Creating accounts...",
    successFallback: "Registration completed successfully.",
    redirectMessage: "Redirecting you to the parent dashboard…",
  },
  ar: {
    pageTitle: "تسجيل ولي الأمر",
    stepsLabel: ["بيانات ولي الأمر", "الأبناء", "مراجعة و تأكيد"] as const,
    step1Title: "الخطوة ١ – بيانات ولي الأمر",
    step2Title: "الخطوة ٢ – بيانات الأبناء",
    step3Title: "الخطوة ٣ – مراجعة و تأكيد",
    step3Intro: "راجع جميع البيانات قبل إنشاء الحسابات.",

    parentFullName: "الاسم الكامل لولي الأمر",
    parentFullNamePlaceholder: "مثال: سارة أحمد",
    parentEmail: "البريد الإلكتروني لولي الأمر",
    parentEmailPlaceholder: "parent@example.com",
    parentPhone: "هاتف ولي الأمر (للتواصل / الدفع)",
    parentPhonePlaceholder: "+20...",
    parentPassword: "كلمة المرور",
    parentPasswordPlaceholder: "••••••••",
    parentPasswordConfirm: "تأكيد كلمة المرور",
    parentPasswordConfirmPlaceholder: "إعادة كتابة كلمة المرور",

    contactPreferenceLabel: "كيف نُفضّل التواصل مع الأبناء؟",
    contactOptionParent:
      "استخدام بيانات ولي الأمر وتعطيل تسجيل الدخول المباشر للابن",
    contactOptionOwn:
      "استخدام البريد الإلكتروني الخاص بكل ابن وتفعيل تسجيل الدخول المباشر",
    contactOptionNote:
      "سيظل لكل ابن حساب مرتبط. عند تفعيل تسجيل الدخول المباشر سنطلب البريد الإلكتروني وكلمة المرور الخاصة بالابن في الخطوة التالية.",
    notesLabel: "ملاحظات لفريق القبول (اختياري)",
    notesPlaceholder: "أي ملاحظات خاصة عن المواعيد أو احتياجات التعلم…",

    childrenIntro:
      "أضف كل ابن/ابنة سيستخدم LearnNova. يمكنك إضافة المزيد لاحقًا من لوحة ولي الأمر.",
    childCardTitle: (index: number) => `ابن رقم ${index + 1}`,
    addChild: "إضافة ابن/ابنة آخر",
    removeChild: "حذف",
    childName: "الاسم الكامل للابن/الابنة",
    childNamePlaceholder: "مثال: عمر علي",
    childEmail: "البريد الإلكتروني للابن لتسجيل الدخول المباشر",
    childEmailPlaceholder: "child@example.com",
    childPassword: "كلمة مرور الابن لتسجيل الدخول المباشر",
    childPasswordPlaceholder: "••••••••",
    childPasswordConfirm: "تأكيد كلمة مرور الابن",
    childPasswordConfirmPlaceholder: "إعادة كتابة كلمة مرور الابن",
    childSystem: "النظام التعليمي",
    childSystemPlaceholder: "اختر النظام…",
    childStage: "المرحلة",
    childStagePlaceholder: "اختر المرحلة…",
    childGradeLevel: "الصف الدراسي",
    childGradeLevelPlaceholder: "اختر الصف…",
    loadingGradeCatalog: "جاري تحميل الصفوف…",
    relationship: "صلة القرابة (أنت بالنسبة للابن/الابنة)",
    relationshipPlaceholder: "اختر صلة القرابة",
    childGender: "نوع الابن/الابنة",
    childGenderPlaceholder: "اختر النوع",
    childPreferredLang: "اللغة المفضلة للابن/الابنة",
    childPreferredLangUnset: "نفس لغة ولي الأمر",

    subjectsLabel: "اختر المواد",
    subjectsPlaceholder: "اختر المواد التي يحتاج طفلك للمساعدة فيها",
    subjectsIntro:
      "يمكنك (اختياريًا) اختيار المواد التي يحتاج كل ابن/ابنة فيها إلى دعم. هذه للمساعدة في التخطيط فقط.",
    loadingSubjects: "جاري تحميل المواد...",
    noSubjects: "لا توجد مواد مضافة حتى الآن.",
    selectedSubjects: (count: number) => `${count} مادة مختارة`,

    reviewParentSection: "ولي الأمر",
    reviewChildrenSection: "الأبناء",
    interestsLabel: "المواد المطلوبة",

    // Validation messages
    requiredField: "هذا الحقل مطلوب",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
    passwordTooShort: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    passwordsDontMatch: "كلمات المرور غير متطابقة",
    requiredParentError:
      "اسم ولي الأمر والبريد الإلكتروني وكلمة المرور مطلوبة، ويجب تطابق كلمتي المرور.",
    requiredChildrenError:
      "من فضلك أكمل بيانات كل ابن/ابنة. عند تفعيل تسجيل الدخول المباشر يجب إضافة البريد الإلكتروني وكلمة المرور لكل ابن/ابنة.",

    genericError: "حدث خطأ أثناء التسجيل. برجاء المحاولة مرة أخرى.",
    next: "التالي",
    back: "السابق",
    cancel: "إلغاء",
    submit: "إنشاء حساب ولي الأمر والأبناء",
    submitting: "جاري إنشاء الحسابات...",
    successFallback: "تم إكمال التسجيل بنجاح.",
    redirectMessage: "جاري تحويلك إلى لوحة ولي الأمر…",
  },
} as const;


// -----------------------------------------------------------------------------
// Parent Relationship (matches DB enum: mother/father/guardian)
// -----------------------------------------------------------------------------
export const parentRelationships = {
  en: [
    { value: "mother", label: "Mother" },
    { value: "father", label: "Father" },
    { value: "guardian", label: "Guardian" },
  ],
  ar: [
    { value: "mother", label: "الأم" },
    { value: "father", label: "الأب" },
    { value: "guardian", label: "ولي أمر آخر" },
  ],
};

// -----------------------------------------------------------------------------
// Child gender (separate from relationship; for semantics / future use)
// -----------------------------------------------------------------------------
export const childGenders = {
  en: [
    { value: "male", label: "Son (male)" },
    { value: "female", label: "Daughter (female)" },
  ],
  ar: [
    { value: "male", label: "ابن (ذكر)" },
    { value: "female", label: "ابنة (أنثى)" },
  ],
};

