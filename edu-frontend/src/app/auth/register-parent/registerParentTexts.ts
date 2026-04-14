// src/app/auth/register-parent/registerParentTexts.ts

// -----------------------------------------------------------------------------
// Shared Types
// -----------------------------------------------------------------------------
export type LangKey = "en" | "ar";

export type GradeStage = "primary" | "preparatory" | "secondary";
export type GradeNumber = "1" | "2" | "3" | "4" | "5" | "6";

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

export type EgyptianSubject = {
  id: number;
  name_en: string;
  name_ar: string;
  gradeStages: GradeStage[];
  gradeNumbers?: GradeNumber[];
  isCore: boolean;
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
// Grade Stages & Numbers (Egyptian system)
// -----------------------------------------------------------------------------
export const gradeStages = {
  en: [
    { value: "primary", label: "Primary School" },
    { value: "preparatory", label: "Preparatory School" },
    { value: "secondary", label: "Secondary School" },
  ],
  ar: [
    { value: "primary", label: "المرحلة الابتدائية" },
    { value: "preparatory", label: "المرحلة الإعدادية" },
    { value: "secondary", label: "المرحلة الثانوية" },
  ],
};

export const gradeNumbers = {
  en: {
    primary: [
      { value: "1", label: "Grade 1" },
      { value: "2", label: "Grade 2" },
      { value: "3", label: "Grade 3" },
      { value: "4", label: "Grade 4" },
      { value: "5", label: "Grade 5" },
      { value: "6", label: "Grade 6" },
    ],
    preparatory: [
      { value: "1", label: "Grade 1" },
      { value: "2", label: "Grade 2" },
      { value: "3", label: "Grade 3" },
    ],
    secondary: [
      { value: "1", label: "Grade 1" },
      { value: "2", label: "Grade 2" },
      { value: "3", label: "Grade 3" },
    ],
  },
  ar: {
    primary: [
      { value: "1", label: "الصف الأول" },
      { value: "2", label: "الصف الثاني" },
      { value: "3", label: "الصف الثالث" },
      { value: "4", label: "الصف الرابع" },
      { value: "5", label: "الصف الخامس" },
      { value: "6", label: "الصف السادس" },
    ],
    preparatory: [
      { value: "1", label: "الصف الأول" },
      { value: "2", label: "الصف الثاني" },
      { value: "3", label: "الصف الثالث" },
    ],
    secondary: [
      { value: "1", label: "الصف الأول" },
      { value: "2", label: "الصف الثاني" },
      { value: "3", label: "الصف الثالث" },
    ],
  },
};

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

// -----------------------------------------------------------------------------
// Egyptian Curriculum Subjects (for fallback / filtering)
// -----------------------------------------------------------------------------
export const egyptianSubjects: EgyptianSubject[] = [
  {
    id: 1,
    name_en: "Arabic Language",
    name_ar: "اللغة العربية",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: true,
  },
  {
    id: 2,
    name_en: "Mathematics",
    name_ar: "الرياضيات",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: true,
  },
  {
    id: 3,
    name_en: "English Language",
    name_ar: "اللغة الإنجليزية",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: true,
  },
  {
    id: 4,
    name_en: "Science",
    name_ar: "العلوم",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: true,
  },
  {
    id: 5,
    name_en: "Social Studies",
    name_ar: "الدراسات الاجتماعية",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: true,
  },
  {
    id: 6,
    name_en: "Religion (Islamic/Christian)",
    name_ar: "التربية الدينية",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: true,
  },
  {
    id: 7,
    name_en: "Computer/IT",
    name_ar: "الحاسب الآلي",
    gradeStages: ["primary", "preparatory", "secondary"],
    gradeNumbers: ["4", "5", "6"],
    isCore: true,
  },
  {
    id: 8,
    name_en: "Art Education",
    name_ar: "التربية الفنية",
    gradeStages: ["primary", "preparatory"],
    isCore: false,
  },
  {
    id: 9,
    name_en: "Music Education",
    name_ar: "التربية الموسيقية",
    gradeStages: ["primary", "preparatory"],
    isCore: false,
  },
  {
    id: 10,
    name_en: "Physical Education",
    name_ar: "التربية الرياضية",
    gradeStages: ["primary", "preparatory", "secondary"],
    isCore: false,
  },
  {
    id: 11,
    name_en: "French Language",
    name_ar: "اللغة الفرنسية",
    gradeStages: ["preparatory", "secondary"],
    isCore: false,
  },
  {
    id: 12,
    name_en: "German Language",
    name_ar: "اللغة الألمانية",
    gradeStages: ["preparatory", "secondary"],
    isCore: false,
  },
  {
    id: 13,
    name_en: "Technology",
    name_ar: "التكنولوجيا",
    gradeStages: ["preparatory"],
    isCore: true,
  },
  {
    id: 14,
    name_en: "National Education",
    name_ar: "التربية الوطنية",
    gradeStages: ["preparatory"],
    isCore: true,
  },
  {
    id: 15,
    name_en: "Physics",
    name_ar: "الفيزياء",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 16,
    name_en: "Chemistry",
    name_ar: "الكيمياء",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 17,
    name_en: "Biology",
    name_ar: "الأحياء",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 18,
    name_en: "Geology",
    name_ar: "الجيولوجيا",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 19,
    name_en: "Philosophy and Logic",
    name_ar: "الفلسفة والمنطق",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 20,
    name_en: "Psychology and Sociology",
    name_ar: "علم النفس والاجتماع",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 21,
    name_en: "Economics and Statistics",
    name_ar: "الاقتصاد والإحصاء",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 22,
    name_en: "History",
    name_ar: "التاريخ",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 23,
    name_en: "Geography",
    name_ar: "الجغرافيا",
    gradeStages: ["secondary"],
    isCore: false,
  },
  {
    id: 24,
    name_en: "Second Foreign Language",
    name_ar: "لغة أجنبية ثانية",
    gradeStages: ["secondary"],
    isCore: false,
  },
];
