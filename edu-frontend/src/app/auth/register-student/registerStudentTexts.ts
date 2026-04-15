export type LangKey = "en" | "ar";

export type CatalogSystem = { id: number; name: string; code: string };
export type CatalogStage = {
  id: number;
  systemId: number;
  nameEn: string;
  nameAr: string;
  code: string;
};
export type CatalogLevel = {
  id: number;
  stageId: number;
  nameEn: string;
  nameAr: string;
  code: string;
};
export type GradeCatalog = {
  systems: CatalogSystem[];
  stages: CatalogStage[];
  levels: CatalogLevel[];
};

export const registerStudentTexts = {
  en: {
    title: "Student Registration",
    subtitle:
      "Create your own LearnNova student account and continue directly to onboarding.",
    pathNoteTitle: "Other registration paths",
    pathNoteBody:
      "Parents can still create child profiles with or without direct child login from the family registration flow.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "e.g. Mariam Ahmed",
    emailLabel: "Email",
    emailPlaceholder: "student@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Repeat your password",
    preferredLangLabel: "Preferred language",
    systemLabel: "Education system",
    systemPlaceholder: "Select system...",
    stageLabel: "Stage",
    stagePlaceholder: "Select stage...",
    gradeLevelLabel: "Grade level",
    gradeLevelPlaceholder: "Select grade level...",
    catalogLoading: "Loading grade catalog...",
    catalogError: "Unable to load the grade catalog right now.",
    submit: "Create student account",
    submitting: "Creating account...",
    signIn: "Sign in",
    createParent: "Create parent account",
    teacherApply: "Apply as teacher",
    alreadyHaveAccount: "Already have an account?",
    genericError: "Unable to create the student account. Please try again.",
    sessionConfirmError: "Unable to confirm the new session after registration.",
    requiredField: "This field is required.",
    invalidEmail: "Please enter a valid email address.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordsDontMatch: "Passwords do not match.",
    systemRequired: "Please choose an education system.",
    stageRequired: "Please choose a stage.",
    gradeLevelRequired: "Please choose a grade level to match classes and teachers.",
    languageArabic: "Arabic",
    languageEnglish: "English",
  },
  ar: {
    title: "تسجيل الطالب",
    subtitle:
      "أنشئ حساب الطالب الخاص بك على LearnNova ثم أكمل الإعداد مباشرة.",
    pathNoteTitle: "مسارات تسجيل أخرى",
    pathNoteBody:
      "ما زال بإمكان ولي الأمر إنشاء ملف للابن مع أو بدون تسجيل دخول مباشر من مسار التسجيل العائلي.",
    fullNameLabel: "الاسم الكامل",
    fullNamePlaceholder: "مثال: مريم أحمد",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "student@example.com",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "8 أحرف على الأقل",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: "أعد كتابة كلمة المرور",
    preferredLangLabel: "اللغة المفضلة",
    systemLabel: "النظام التعليمي",
    systemPlaceholder: "اختر النظام...",
    stageLabel: "المرحلة",
    stagePlaceholder: "اختر المرحلة...",
    gradeLevelLabel: "الصف الدراسي",
    gradeLevelPlaceholder: "اختر الصف الدراسي...",
    catalogLoading: "جارٍ تحميل دليل الصفوف...",
    catalogError: "تعذر تحميل دليل الصفوف الآن.",
    submit: "إنشاء حساب الطالب",
    submitting: "جارٍ إنشاء الحساب...",
    signIn: "تسجيل الدخول",
    createParent: "إنشاء حساب ولي أمر",
    teacherApply: "التقديم كمعلم",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    genericError: "تعذر إنشاء حساب الطالب. يرجى المحاولة مرة أخرى.",
    sessionConfirmError: "تعذر تأكيد الجلسة الجديدة بعد التسجيل.",
    requiredField: "هذا الحقل مطلوب.",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    passwordTooShort: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
    passwordsDontMatch: "كلمتا المرور غير متطابقتين.",
    systemRequired: "يرجى اختيار النظام التعليمي.",
    stageRequired: "يرجى اختيار المرحلة.",
    gradeLevelRequired: "يرجى اختيار الصف الدراسي لمطابقة الحصص والمعلمين.",
    languageArabic: "العربية",
    languageEnglish: "English",
  },
} as const;
