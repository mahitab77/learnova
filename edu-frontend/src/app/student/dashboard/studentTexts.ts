// src/app/student/dashboard/studentTexts.ts
// studentTexts.ts - Internationalization texts for Student Dashboard

import type { Lang, StudentLangTexts } from "./studentTypes";

/**
 * IMPORTANT:
 * - We DO NOT export a type derived from `texts` because it creates literal-string unions
 *   (e.g., "Student Dashboard" vs "لوحة الطالب") which can trigger TS2322.
 * - `StudentLangTexts` should be defined once (in studentTypes.ts) with `string` fields.
 * - `satisfies` enforces that both `en` and `ar` match the required keys.
 */
export const texts = {
  en: {
    title: "Student Dashboard",
    welcomePrefix: "Welcome back,",
    subtitle: "Here's a quick look at your learning today.",
    gradeLabel: "Grade",
    loading: "Loading your dashboard…",
    error: "We couldn't load your dashboard. Please try again.",
    notLoggedIn: "You are not logged in. Please sign in first.",

    stats: {
      subjects: "My subjects",
      attendance: "Attendance",
      todos: "To-dos",
      todosSuffix: "pending tasks",
    },

    tabs: {
      overview: "Overview",
      subjects: "Subjects",
      schedule: "Schedule",
      homework: "Homework",
      quizzes: "Quizzes",
      attendance: "Attendance",
      grades: "Grades",
      announcements: "Announcements",
      notifications: "Notifications",
      profile: "Profile",
    },

    actions: {
      manageSelections: "Manage subject selections",
      goToSelections: "Selet Teacher-Subject",
      viewDetails: "View details",
      close: "Close",
      markAllRead: "Mark all as read",
      markRead: "Mark as read",
      requestLesson: "Request",
      cancelRequest: "Cancel",
      requestLessonTitle: "Request a Lesson",
      rateTeacher: "Rate teacher",
    },

    rating: {
      title: "How was your teacher?",
      yourRating: "Your rating",
      optionalComment: "Optional comment",
      placeholder: "Share a short note about the session",
      save: "Save rating",
      update: "Update rating",
      rated: "Rated",
      availableWindow:
        "Rating is available for 7 days after session completion.",
      notEligible: "Rating is only available after a completed session.",
    },

    sections: {
      upcomingLessons: "Today & upcoming lessons",
      noLessons: "No upcoming lessons yet.",

      homeworkQuizzes: "Homework & quizzes",
      homework: "Homework",
      quizzes: "Quizzes",
      noHomework: "No pending homework. Great job!",
      noQuizzes: "No pending quizzes right now.",

      subjects: "Your subjects",

      announcements: "Announcements",
      noAnnouncements: "No announcements yet.",

      notifications: "Notifications",
      noNotifications: "No notifications yet.",
      unreadBadge: "unread",

      recentGrades: "Recent grades",
      attendanceSummary: "Attendance summary",
      attendanceLessons: "Attendance by lesson",
      profileInfo: "Profile information",

      // Phase 3
      lessonRequests: "Lesson Requests",
      myLessonRequests: "My Lesson Requests",
      pendingRequests: "Pending Requests",
      noPendingRequests: "No pending lesson requests.",
      teacherAvailability: "Teacher Availability",
      noAvailability: "No teacher availability found.",
      noLessonsAction: "Go to Schedule to book a lesson",
      bookingRaceHint: "That time slot may no longer be available. Try a different slot or refresh availability.",
    },

    labels: {
      due: "Due",
      at: "at",
      time: "Time",
      teacher: "Teacher",
      subject: "Subject",
      status: "Status",
      day: "Day",

      spots: "spots",
      available: "available",
      requested: "Requested ✓",
      full: "Full",
      pending: "Pending",
    },

    weekdays: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    },
  },

  ar: {
    title: "لوحة الطالب",
    welcomePrefix: "مرحبًا بعودتك،",
    subtitle: "هذه لمحة سريعة عن تعلّمك اليوم.",
    gradeLabel: "الصف",
    loading: "جاري تحميل لوحة الطالب…",
    error: "تعذّر تحميل لوحة الطالب. حاول مرة أخرى.",
    notLoggedIn: "أنت غير مسجل الدخول. يرجى تسجيل الدخول أولاً.",

    stats: {
      subjects: "موادي",
      attendance: "الحضور",
      todos: "المهام",
      todosSuffix: "مهمة معلّقة",
    },

    tabs: {
      overview: "نظرة عامة",
      subjects: "المواد",
      schedule: "الجدول",
      homework: "الواجبات",
      quizzes: "الاختبارات",
      attendance: "الحضور",
      grades: "الدرجات",
      announcements: "الإعلانات",
      notifications: "الإشعارات",
      profile: "الملف الشخصي",
    },

    actions: {
      manageSelections: "إدارة اختيارات المواد",
      goToSelections: "أختار المدرس-المادة",
      viewDetails: "عرض التفاصيل",
      close: "إغلاق",
      markAllRead: "تعيين الكل كمقروء",
      markRead: "تعيين كمقروء",
      requestLesson: "طلب",
      cancelRequest: "إلغاء",
      requestLessonTitle: "طلب حصة",
      rateTeacher: "قيّم المدرس",
    },

    rating: {
      title: "كيف كان المدرس؟",
      yourRating: "تقييمك",
      optionalComment: "تعليق اختياري",
      placeholder: "اكتب ملاحظة قصيرة عن الحصة",
      save: "حفظ التقييم",
      update: "تحديث التقييم",
      rated: "تم التقييم",
      availableWindow: "التقييم متاح لمدة 7 أيام بعد انتهاء الحصة.",
      notEligible: "التقييم متاح فقط بعد إتمام الحصة.",
    },

    sections: {
      upcomingLessons: "حصص اليوم والحصص القادمة",
      noLessons: "لا توجد حصص قادمة الآن.",

      homeworkQuizzes: "الواجبات والاختبارات",
      homework: "الواجبات",
      quizzes: "الاختبارات",
      noHomework: "لا توجد واجبات معلّقة. أحسنت!",
      noQuizzes: "لا توجد اختبارات معلّقة الآن.",

      subjects: "المواد الدراسية",

      announcements: "الإعلانات",
      noAnnouncements: "لا توجد إعلانات حالياً.",

      notifications: "الإشعارات",
      noNotifications: "لا توجد إشعارات حالياً.",
      unreadBadge: "غير مقروء",

      recentGrades: "الدرجات الأخيرة",
      attendanceSummary: "ملخص الحضور",
      attendanceLessons: "الحضور حسب الحصة",
      profileInfo: "بيانات الملف الشخصي",

      // Phase 3
      lessonRequests: "طلبات الحصص",
      myLessonRequests: "طلباتي للحصص",
      pendingRequests: "الطلبات المعلّقة",
      noPendingRequests: "لا توجد طلبات حصص معلّقة.",
      teacherAvailability: "توافر المدرسين",
      noAvailability: "لم يتم العثور على توافر للمدرسين.",
      noLessonsAction: "انتقل إلى الجدول لحجز حصة",
      bookingRaceHint: "قد لا يكون هذا الوقت متاحاً بعد الآن. جرب وقتاً آخر أو قم بتحديث التوفر.",
    },

    labels: {
      due: "تسليم",
      at: "الساعة",
      time: "الوقت",
      teacher: "المدرس",
      subject: "المادة",
      status: "الحالة",
      day: "اليوم",

      spots: "مقاعد",
      available: "متاح",
      requested: "تم الطلب ✓",
      full: "ممتلئ",
      pending: "معلق",
    },

    weekdays: {
      monday: "الاثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
      saturday: "السبت",
      sunday: "الأحد",
    },
  },
} satisfies Record<Lang, StudentLangTexts>;
