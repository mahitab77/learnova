// src/app/moderator/dashboard/moderatorTexts.ts
// ============================================================================
// Moderator Dashboard i18n Texts (English + Arabic)
// ============================================================================

import type { Lang } from "./moderatorTypes";

export const texts = {
  en: {
    pageTitle: "Moderator Dashboard",
    pageSubtitle: "Monitor sessions, attendance, and platform activity.",
    notModeratorTitle: "Access restricted",
    notModeratorBody: "You must be a moderator to view this page. Please log in with a moderator account.",
    loading: "Loading...",
    retry: "Retry",
    refresh: "Refresh",
    search: "Search",

    tabs: ["Sessions", "Students", "Teachers", "Homework", "Quizzes"] as const,

    // Sessions
    sessionsTitle: "Lesson Sessions",
    sessionsDesc: "View all scheduled and completed lesson sessions. Excuse absent students.",
    sessionsNone: "No lesson sessions found.",
    sessionsSearchPlaceholder: "Search by teacher or subject...",
    sessionsFilterAll: "All statuses",
    sessionsColTeacher: "Teacher",
    sessionsColSubject: "Subject",
    sessionsColTime: "Time",
    sessionsColStudents: "Students",
    sessionsColStatus: "Status",
    sessionsExpand: "View students",
    sessionsCollapse: "Hide students",
    sessionsGroup: "Group",
    sessionsIndividual: "Individual",

    // Session students sub-table
    studentsSubColName: "Student",
    studentsSubColEmail: "Email",
    studentsSubColAttendance: "Attendance",
    studentsSubExcuse: "Excuse",
    studentsSubExcusing: "Marking...",
    studentsSubExcuseSuccess: "Marked as excused.",
    studentsSubExcuseError: "Failed to mark as excused.",
    studentsSubNone: "No students enrolled in this session.",

    // Students
    studentsTitle: "Students",
    studentsDesc: "Read-only view of all enrolled students.",
    studentsNone: "No students found.",
    studentsSearchPlaceholder: "Search by name or email...",
    studentsColName: "Name",
    studentsColEmail: "Email",
    studentsColLang: "Language",
    studentsColStatus: "Status",
    studentsColCreated: "Created",
    studentsStatusActive: "Active",
    studentsStatusInactive: "Inactive",

    // Teachers
    teachersTitle: "Teachers",
    teachersDesc: "Read-only view of all teachers and their subjects.",
    teachersNone: "No teachers found.",
    teachersSearchPlaceholder: "Search by name or subject...",
    teachersColName: "Name",
    teachersColSubjects: "Subjects",
    teachersColStatus: "Status",
    teachersStatusActive: "Active",
    teachersStatusInactive: "Inactive",

    // Homework
    homeworkTitle: "Homework Assignments",
    homeworkDesc: "Read-only view of all homework assigned by teachers.",
    homeworkNone: "No homework assignments found.",
    homeworkSearchPlaceholder: "Search by title or teacher...",
    homeworkColTitle: "Title",
    homeworkColTeacher: "Teacher",
    homeworkColSubject: "Subject",
    homeworkColDue: "Due",
    homeworkColScore: "Max Score",
    homeworkColStatus: "Status",
    homeworkStatusActive: "Active",
    homeworkStatusInactive: "Inactive",

    // Quizzes
    quizzesTitle: "Quiz Assignments",
    quizzesDesc: "Read-only view of all quizzes assigned by teachers.",
    quizzesNone: "No quiz assignments found.",
    quizzesSearchPlaceholder: "Search by title or teacher...",
    quizzesColTitle: "Title",
    quizzesColTeacher: "Teacher",
    quizzesColSubject: "Subject",
    quizzesColAvailable: "Available",
    quizzesColTimeLimit: "Time Limit",
    quizzesColScore: "Max Score",
    quizzesColStatus: "Status",
    quizzesStatusActive: "Active",
    quizzesStatusInactive: "Inactive",
    quizzesMinutes: "min",
  },

  ar: {
    pageTitle: "لوحة تحكم المشرف المساعد",
    pageSubtitle: "متابعة الجلسات والحضور ونشاط المنصة.",
    notModeratorTitle: "وصول مقيّد",
    notModeratorBody: "يجب أن تكون مشرفًا مساعدًا لمشاهدة هذه الصفحة. برجاء تسجيل الدخول بحساب مشرف مساعد.",
    loading: "جاري التحميل...",
    retry: "إعادة المحاولة",
    refresh: "تحديث",
    search: "بحث",

    tabs: ["الجلسات", "الطلاب", "المعلمون", "الواجبات", "الاختبارات"] as const,

    // Sessions
    sessionsTitle: "جلسات الدروس",
    sessionsDesc: "عرض جميع الجلسات المجدولة والمنجزة. منح إعفاء للطلاب الغائبين.",
    sessionsNone: "لا توجد جلسات.",
    sessionsSearchPlaceholder: "بحث باسم المعلم أو المادة...",
    sessionsFilterAll: "كل الحالات",
    sessionsColTeacher: "المعلم",
    sessionsColSubject: "المادة",
    sessionsColTime: "الوقت",
    sessionsColStudents: "الطلاب",
    sessionsColStatus: "الحالة",
    sessionsExpand: "عرض الطلاب",
    sessionsCollapse: "إخفاء الطلاب",
    sessionsGroup: "جماعية",
    sessionsIndividual: "فردية",

    // Session students sub-table
    studentsSubColName: "الطالب",
    studentsSubColEmail: "البريد الإلكتروني",
    studentsSubColAttendance: "الحضور",
    studentsSubExcuse: "منح إعفاء",
    studentsSubExcusing: "جاري التسجيل...",
    studentsSubExcuseSuccess: "تم تسجيل الإعفاء.",
    studentsSubExcuseError: "تعذر تسجيل الإعفاء.",
    studentsSubNone: "لا يوجد طلاب مسجلون في هذه الجلسة.",

    // Students
    studentsTitle: "الطلاب",
    studentsDesc: "عرض قائمة الطلاب المسجلين (للقراءة فقط).",
    studentsNone: "لا يوجد طلاب.",
    studentsSearchPlaceholder: "بحث بالاسم أو البريد الإلكتروني...",
    studentsColName: "الاسم",
    studentsColEmail: "البريد الإلكتروني",
    studentsColLang: "اللغة",
    studentsColStatus: "الحالة",
    studentsColCreated: "تاريخ الإنشاء",
    studentsStatusActive: "فعّال",
    studentsStatusInactive: "غير فعّال",

    // Teachers
    teachersTitle: "المعلمون",
    teachersDesc: "عرض قائمة المعلمين ومواد كل منهم (للقراءة فقط).",
    teachersNone: "لا يوجد معلمون.",
    teachersSearchPlaceholder: "بحث بالاسم أو المادة...",
    teachersColName: "الاسم",
    teachersColSubjects: "المواد",
    teachersColStatus: "الحالة",
    teachersStatusActive: "فعّال",
    teachersStatusInactive: "غير فعّال",

    // Homework
    homeworkTitle: "الواجبات المنزلية",
    homeworkDesc: "عرض جميع الواجبات المنزلية المضافة من المعلمين (للقراءة فقط).",
    homeworkNone: "لا توجد واجبات.",
    homeworkSearchPlaceholder: "بحث بالعنوان أو المعلم...",
    homeworkColTitle: "العنوان",
    homeworkColTeacher: "المعلم",
    homeworkColSubject: "المادة",
    homeworkColDue: "تاريخ التسليم",
    homeworkColScore: "الدرجة القصوى",
    homeworkColStatus: "الحالة",
    homeworkStatusActive: "فعّال",
    homeworkStatusInactive: "غير فعّال",

    // Quizzes
    quizzesTitle: "الاختبارات",
    quizzesDesc: "عرض جميع الاختبارات المضافة من المعلمين (للقراءة فقط).",
    quizzesNone: "لا توجد اختبارات.",
    quizzesSearchPlaceholder: "بحث بالعنوان أو المعلم...",
    quizzesColTitle: "العنوان",
    quizzesColTeacher: "المعلم",
    quizzesColSubject: "المادة",
    quizzesColAvailable: "متاح من",
    quizzesColTimeLimit: "المدة",
    quizzesColScore: "الدرجة القصوى",
    quizzesColStatus: "الحالة",
    quizzesStatusActive: "فعّال",
    quizzesStatusInactive: "غير فعّال",
    quizzesMinutes: "دقيقة",
  },
} as const;

export type Texts = typeof texts;
export type LangTexts = Texts[Lang];

export function getTexts(lang: Lang): LangTexts {
  return texts[lang];
}
