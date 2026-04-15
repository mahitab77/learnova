// src/app/teacher/dashboard/teacherDashboardTexts.ts

/**
 * =============================================================================
 * Teacher Dashboard Texts (EN + AR) — COMPREHENSIVE UNIFIED VERSION
 * -----------------------------------------------------------------------------
 * ✅ Combines best of both files
 * ✅ Includes all tabs: overview, sessions, students, homework, quizzes, 
 *    schedule, exceptions, profile, videos, messages
 * ✅ No duplicates
 * ✅ Complete bilingual coverage
 * =============================================================================
 */

import type { Lang } from "./teacherDashboardTypes";

export type TeacherDashboardLanguagePack = {
  direction: "ltr" | "rtl";

  // Page / Header
  pageTitle: string;
  pageSubtitle: string;
  header: {
    refresh: string;
    loadingProfile: string;
    statusPrefix: string;
    failedTitle: string;
    failedHint: string;
  };

  // Tabs (All from both files)
  tabs: {
    overview: string;
    sessions: string;
    students: string;
    homework: string;
    quizzes: string;
    schedule: string;
    exceptions: string;
    videos: string;
    profile: string;
    messages: string;
    lessonRequests: string;
  };

  // Common buttons/labels
  common: {
    close: string;
    cancel: string;
    save: string;
    add: string;
    edit: string;
    delete: string;
    export: string;
    submissions: string;
    grade: string;
    enable: string;
    disable: string;
    setPrimary: string;
    optional: string;
    noData: string;
    loading: string;
    refresh: string;
    errorGeneric: string;
    empty: string;
  };

  // Generic placeholders
  placeholders: {
    search: string;
    searchBySubjectStatusDate: string;
    searchByStudentEmailSubject: string;
    searchByTitleSubject: string;
  };

  // Status / badges (shared)
  status: {
    active: string;
    inactive: string;

    // Students selection status
    approved: string;
    pending: string;
    rejected: string;

    // Sessions
    scheduled: string;
    completed: string;
    cancelled: string;
    noShow: string;

    // Attendance
    attendance: {
      scheduled: string;
      present: string;
      absent: string;
      late: string;
      excused: string;
    };

    // Grading
    ungraded: string;
    graded: string;
  };

  // Overview panel
  overview: {
    stats: {
      approvedStudents: {
        title: string;
        subtitle: string;
      };
      todaySessions: {
        title: string;
        subtitle: string;
      };
      activeHomework: {
        title: string;
        subtitle: string;
      };
      activeQuizzes: {
        title: string;
        subtitle: string;
      };
      activeSlots: {
        title: string;
        subtitle: string;
      };
      activeExceptions: {
        title: string;
        subtitle: string;
      };
    };

    todaySessionsCard: {
      title: string;
      subtitle: string;
      emptyTitle: string;
      emptyHint: string;
    };

    weeklyScheduleCard: {
      title: string;
      subtitle: string;
      hint: string;
    };
  };

  // Sessions panel
  sessions: {
    title: string;
    subtitle: string;
    table: {
      subject: string;
      time: string;
      status: string;
      students: string;
    };
    emptyTitle: string;
  };

  // Students panel
  students: {
    title: string;
    subtitle: string;
    table: {
      student: string;
      subject: string;
      status: string;
      selectedAt: string;
    };
    emptyTitle: string;
  };

  // Homework panel
  homework: {
    title: string;
    subtitle: string;
    newButton: string;
    emptyTitle: string;
    item: {
      duePrefix: string;
    };
  };

  // Quizzes panel
  quizzes: {
    title: string;
    subtitle: string;
    newButton: string;
    emptyTitle: string;
    item: {
      duePrefix: string;
    };
  };

  // Schedule panel
  schedule: {
    title: string;
    subtitle: string;
    form: {
      day: string;
      from: string;
      to: string;
      group: string;
      max: string;
    };
    modes: {
      oneToOne: string;
      group: string;
    };
    emptyTitle: string;
    offerings: {
      title: string;
      manage: string;
      empty: string;
      add: string;
      remove: string;
      save: string;
      cancel: string;
      subject: string;
      system: string;
      stage: string;
      grade: string;
      allGradesInStage: string;
      draftSlot: string;
      liveSlot: string;
      updated: string;
      loadError: string;
      saveError: string;
      oneOffering: string;
      manyOfferingsSuffix: string;
      stageWide: string;
    };
  };

  // Exceptions panel
  exceptions: {
    title: string;
    subtitle: string;
    form: {
      date: string;
      from: string;
      to: string;
      type: string;
      group: string;
      note: string;
      reason: string;
    };
    types: {
      block: string;
      add: string;
    };
    emptyTitle: string;
  };

  // Videos panel (from second file)
  videos: {
    title: string;
    subtitle: string;
    emptyTitle: string;
  };

  // Profile panel
  profile: {
    title: string;
    subtitle: string;
    fields: {
      name: string;
      phone: string;
      bioShort: string;
      photoUrl: string;
    };

    videos: {
      title: string;
      subtitle: string;
      subjectId: string;
      videoUrl: string;
      primary: string;
      addVideo: string;
      emptyTitle: string;
      note: string;
    };
  };

  // Messages panel (from second file)
  messages: {
    title: string;
    subtitle: string;
    tabAnnouncements: string;
    tabNotifications: string;
    announcementsEmpty: string;
    notificationsUnread: string;
    notificationsEmpty: string;
    markRead: string;
    markAllRead: string;
    typeLabel: string;
    relatedLabel: string;
  };

  // Lesson requests panel
  lessonRequests: {
    title: string;
    subtitle: string;
    empty: string;
    loadError: string;
    student: string;
    subject: string;
    time: string;
    requestedBy: string;
    approve: string;
    reject: string;
    rejectReason: string;
    rejectReasonPlaceholder: string;
    confirmReject: string;
    cancelReject: string;
  };

  // Modals
  modals: {
    sessionDetails: {
      title: string;
      studentsAttendanceTitle: string;
      studentsAttendanceSubtitle: string;
      emptyStudents: string;
    };

    homeworkModal: {
      newTitle: string;
      editTitle: string;
      subjectIdHelp: string;
      dueAtLabel: string;
      titleLabel: string;
      descriptionLabel: string;
      maxScoreLabel: string;
      attachmentsLabel: string;
      statusLabel: string;
    };

    quizModal: {
      newTitle: string;
      editTitle: string;
      subjectIdHelp: string;
      dueAtLabel: string;
      titleLabel: string;
      descriptionLabel: string;
      maxScoreLabel: string;
      quizUrlLabel: string;
      statusLabel: string;
    };

    submissions: {
      titleFallback: string;
      emptyTitle: string;
      statusPrefix: string;
    };

    grade: {
      title: string;
      typePrefix: string;
      submissionIdPrefix: string;
      scoreLabel: string;
      feedbackLabel: string;
      feedbackPlaceholder: string;
    };
  };
};

export const teacherDashboardTexts: Record<Lang, TeacherDashboardLanguagePack> = {
  en: {
    direction: "ltr",

    // Page / Header
    pageTitle: "Teacher Dashboard",
    pageSubtitle: "Manage your students, sessions, homework, schedules and more.",
    header: {
      refresh: "Refresh",
      loadingProfile: "Loading profile...",
      statusPrefix: "Status",
      failedTitle: "Failed to load dashboard",
      failedHint:
        "This is usually caused by API route mismatch or /teacher routes not being mounted on the server.",
    },

    // Tabs (All unified)
    tabs: {
      overview: "Overview",
      sessions: "Sessions",
      students: "Students",
      homework: "Homework",
      quizzes: "Quizzes",
      schedule: "Schedule",
      exceptions: "Exceptions",
      videos: "Videos",
      profile: "Profile",
      messages: "Messages",
      lessonRequests: "Lesson Requests",
    },

    // Common buttons/labels
    common: {
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      export: "Export",
      submissions: "Submissions",
      grade: "Grade",
      enable: "Enable",
      disable: "Disable",
      setPrimary: "Set Primary",
      optional: "Optional",
      noData: "No data",
      loading: "Loading...",
      refresh: "Refresh",
      errorGeneric: "Something went wrong.",
      empty: "No data yet.",
    },

    // Generic placeholders
    placeholders: {
      search: "Search...",
      searchBySubjectStatusDate: "Search by subject/status/date...",
      searchByStudentEmailSubject: "Search by student/email/subject...",
      searchByTitleSubject: "Search by title/subject...",
    },

    // Status / badges (shared)
    status: {
      active: "Active",
      inactive: "Inactive",

      approved: "approved",
      pending: "pending",
      rejected: "rejected",

      scheduled: "scheduled",
      completed: "completed",
      cancelled: "cancelled",
      noShow: "no_show",

      attendance: {
        scheduled: "scheduled",
        present: "present",
        absent: "absent",
        late: "late",
        excused: "excused",
      },

      ungraded: "Ungraded",
      graded: "Graded",
    },

    // Overview panel
    overview: {
      stats: {
        approvedStudents: {
          title: "Approved Students",
          subtitle: "From student selections",
        },
        todaySessions: {
          title: "Today Sessions",
          subtitle: "Scheduled/Pending today",
        },
        activeHomework: {
          title: "Active Homework",
          subtitle: "Currently active",
        },
        activeQuizzes: {
          title: "Active Quizzes",
          subtitle: "Currently active",
        },
        activeSlots: {
          title: "Active Slots",
          subtitle: "Weekly schedule",
        },
        activeExceptions: {
          title: "Active Exceptions",
          subtitle: "Overrides",
        },
      },

      todaySessionsCard: {
        title: "Today Sessions",
        subtitle: "Click for details & attendance",
        emptyTitle: "No sessions today",
        emptyHint: "Check all sessions in the Sessions tab.",
      },

      weeklyScheduleCard: {
        title: "Weekly Schedule",
        subtitle: "Active slots & exceptions",
        hint: "Manage slots in Schedule tab, and exceptions in Exceptions tab.",
      },
    },

    // Sessions panel
    sessions: {
      title: "Lesson Sessions",
      subtitle: "Local search (filters can be added later)",
      table: {
        subject: "Subject",
        time: "Time",
        status: "Status",
        students: "Students",
      },
      emptyTitle: "No sessions",
    },

    // Students panel
    students: {
      title: "Students",
      subtitle: "From student_teacher_selections",
      table: {
        student: "Student",
        subject: "Subject",
        status: "Status",
        selectedAt: "Selected",
      },
      emptyTitle: "No students",
    },

    // Homework panel
    homework: {
      title: "Homework",
      subtitle: "Create/Edit + submissions + grading",
      newButton: "New",
      emptyTitle: "No homework",
      item: {
        duePrefix: "Due",
      },
    },

    // Quizzes panel
    quizzes: {
      title: "Quizzes",
      subtitle: "Create/Edit + submissions + grading",
      newButton: "New",
      emptyTitle: "No quizzes",
      item: {
        duePrefix: "Due",
      },
    },

    // Schedule panel
    schedule: {
      title: "Schedule Slots",
      subtitle: "Create + toggle active + delete",
      form: {
        day: "Day",
        from: "From",
        to: "To",
        group: "Group?",
        max: "Max",
      },
      modes: {
        oneToOne: "1:1",
        group: "Group",
      },
      emptyTitle: "No slots",
      offerings: {
        title: "Offerings",
        manage: "Offerings",
        empty: "No offerings yet",
        add: "Add offering",
        remove: "Remove offering",
        save: "Save offerings",
        cancel: "Cancel",
        subject: "Subject",
        system: "System",
        stage: "Stage",
        grade: "Grade",
        allGradesInStage: "All grades in this stage",
        draftSlot: "Draft slot",
        liveSlot: "Live slot",
        updated: "Offerings updated",
        loadError: "Failed to load offerings",
        saveError: "Failed to save offerings",
        oneOffering: "1 offering",
        manyOfferingsSuffix: "offerings",
        stageWide: "Stage-wide",
      },
    },

    // Exceptions panel
    exceptions: {
      title: "Schedule Exceptions",
      subtitle: "Add a day/slot (block or add)",
      form: {
        date: "Date",
        from: "From",
        to: "To",
        type: "Type",
        group: "Group?",
        note: "Note",
        reason: "Reason",
      },
      types: {
        block: "Block",
        add: "Add",
      },
      emptyTitle: "No exceptions",
    },

    // Videos panel
    videos: {
      title: "Teacher Videos",
      subtitle: "Manage your teaching videos",
      emptyTitle: "No videos",
    },

    // Profile panel
    profile: {
      title: "Profile",
      subtitle: "Basic profile update",
      fields: {
        name: "Name",
        phone: "Phone",
        bioShort: "Short Bio",
        photoUrl: "Photo URL",
      },

      videos: {
        title: "Teacher Videos",
        subtitle: "Add/Delete/Set primary by subject selection",
        subjectId: "Subject",
        videoUrl: "Video URL",
        primary: "Primary?",
        addVideo: "Add Video",
        emptyTitle: "No videos",
        note: "Note: Select the subject from your assigned subject catalog.",
      },
    },

    // Messages panel
    messages: {
      title: "Messages",
      subtitle: "Announcements from admin and your notification inbox.",
      tabAnnouncements: "Announcements",
      tabNotifications: "Notifications",
      announcementsEmpty: "No announcements yet.",
      notificationsUnread: "Unread",
      notificationsEmpty: "No notifications yet.",
      markRead: "Mark read",
      markAllRead: "Mark all read",
      typeLabel: "Type",
      relatedLabel: "Related",
    },

    // Lesson requests panel
    lessonRequests: {
      title: "Lesson Requests",
      subtitle: "Pending lesson requests from students awaiting your approval.",
      empty: "No pending lesson requests.",
      loadError: "Failed to load lesson requests.",
      student: "Student",
      subject: "Subject",
      time: "Time",
      requestedBy: "Requested by",
      approve: "Approve",
      reject: "Reject",
      rejectReason: "Reason (optional)",
      rejectReasonPlaceholder: "e.g. Not available at this time",
      confirmReject: "Confirm Reject",
      cancelReject: "Cancel",
    },

    // Modals
    modals: {
      sessionDetails: {
        title: "Session Details",
        studentsAttendanceTitle: "Students & Attendance",
        studentsAttendanceSubtitle: "Update attendance status per student",
        emptyStudents: "No students",
      },

      homeworkModal: {
        newTitle: "New Homework",
        editTitle: "Edit Homework",
        subjectIdHelp: "Select subject",
        dueAtLabel: "Due at (SQL datetime)",
        titleLabel: "Title",
        descriptionLabel: "Description",
        maxScoreLabel: "Max score",
        attachmentsLabel: "Attachments URL",
        statusLabel: "Status",
      },

      quizModal: {
        newTitle: "New Quiz",
        editTitle: "Edit Quiz",
        subjectIdHelp: "Select subject",
        dueAtLabel: "Due at (SQL datetime)",
        titleLabel: "Title",
        descriptionLabel: "Description",
        maxScoreLabel: "Max score",
        quizUrlLabel: "Quiz URL",
        statusLabel: "Status",
      },

      submissions: {
        titleFallback: "Submissions",
        emptyTitle: "No submissions",
        statusPrefix: "Status",
      },

      grade: {
        title: "Grade",
        typePrefix: "Type",
        submissionIdPrefix: "Submission ID",
        scoreLabel: "Score",
        feedbackLabel: "Feedback",
        feedbackPlaceholder: "Optional",
      },
    },
  },

  ar: {
    direction: "rtl",

    // Page / Header
    pageTitle: "لوحة المعلم",
    pageSubtitle: "إدارة الطلاب والجلسات والواجبات والجداول والمزيد.",
    header: {
      refresh: "تحديث",
      loadingProfile: "جارٍ تحميل بيانات الملف...",
      statusPrefix: "الحالة",
      failedTitle: "فشل تحميل اللوحة",
      failedHint:
        "غالباً السبب هو عدم تطابق مسارات الـ API أو أن /teacher routes غير مركّبة على السيرفر.",
    },

    // Tabs (All unified)
    tabs: {
      overview: "نظرة عامة",
      sessions: "الحصص",
      students: "الطلاب",
      homework: "الواجبات",
      quizzes: "الاختبارات",
      schedule: "الجدول",
      exceptions: "استثناءات",
      videos: "الفيديوهات",
      profile: "الملف الشخصي",
      messages: "الرسائل",
      lessonRequests: "طلبات الحصص",
    },

    // Common buttons/labels
    common: {
      close: "إغلاق",
      cancel: "إلغاء",
      save: "حفظ",
      add: "إضافة",
      edit: "تعديل",
      delete: "حذف",
      export: "تصدير",
      submissions: "التسليمات",
      grade: "تقييم",
      enable: "تفعيل",
      disable: "إيقاف",
      setPrimary: "تعيين أساسي",
      optional: "اختياري",
      noData: "لا توجد بيانات",
      loading: "جاري التحميل...",
      refresh: "تحديث",
      errorGeneric: "حدث خطأ ما.",
      empty: "لا توجد بيانات بعد.",
    },

    // Generic placeholders
    placeholders: {
      search: "بحث...",
      searchBySubjectStatusDate: "ابحث بالمادة/الحالة/التاريخ...",
      searchByStudentEmailSubject: "ابحث باسم الطالب/الإيميل/المادة...",
      searchByTitleSubject: "ابحث بالعنوان/المادة...",
    },

    // Status / badges (shared)
    status: {
      active: "فعّال",
      inactive: "موقوف",

      approved: "approved",
      pending: "pending",
      rejected: "rejected",

      scheduled: "scheduled",
      completed: "completed",
      cancelled: "cancelled",
      noShow: "no_show",

      attendance: {
        scheduled: "scheduled",
        present: "present",
        absent: "absent",
        late: "late",
        excused: "excused",
      },

      ungraded: "غير مُقيّم",
      graded: "مُقيّم",
    },

    // Overview panel
    overview: {
      stats: {
        approvedStudents: {
          title: "طلاب معتمدون",
          subtitle: "من اختيارات الطلاب",
        },
        todaySessions: {
          title: "حصص اليوم",
          subtitle: "مجدول/قيد الانتظار اليوم",
        },
        activeHomework: {
          title: "واجبات فعّالة",
          subtitle: "الواجبات المتاحة",
        },
        activeQuizzes: {
          title: "اختبارات فعّالة",
          subtitle: "الاختبارات المتاحة",
        },
        activeSlots: {
          title: "فترات نشطة",
          subtitle: "الجدول الأسبوعي",
        },
        activeExceptions: {
          title: "استثناءات نشطة",
          subtitle: "تعديلات على الجدول",
        },
      },

      todaySessionsCard: {
        title: "حصص اليوم",
        subtitle: "اضغط لعرض التفاصيل والحضور",
        emptyTitle: "لا توجد حصص اليوم",
        emptyHint: "راجع جميع الحصص في تبويب الحصص.",
      },

      weeklyScheduleCard: {
        title: "الجدول الأسبوعي",
        subtitle: "فترات نشطة واستثناءات",
        hint: "يمكنك إدارة الفترات في تبويب الجدول، وإدارة الاستثناءات في تبويب الاستثناءات.",
      },
    },

    // Sessions panel
    sessions: {
      title: "الحصص",
      subtitle: "بحث محلي (يمكن إضافة فلاتر لاحقاً)",
      table: {
        subject: "المادة",
        time: "الوقت",
        status: "الحالة",
        students: "طلاب",
      },
      emptyTitle: "لا توجد حصص",
    },

    // Students panel
    students: {
      title: "الطلاب",
      subtitle: "من student_teacher_selections",
      table: {
        student: "الطالب",
        subject: "المادة",
        status: "الحالة",
        selectedAt: "التاريخ",
      },
      emptyTitle: "لا يوجد طلاب",
    },

    // Homework panel
    homework: {
      title: "الواجبات",
      subtitle: "إنشاء/تعديل + عرض التسليمات + تقييم",
      newButton: "جديد",
      emptyTitle: "لا توجد واجبات",
      item: {
        duePrefix: "تسليم",
      },
    },

    // Quizzes panel
    quizzes: {
      title: "الاختبارات",
      subtitle: "إنشاء/تعديل + عرض التسليمات + تقييم",
      newButton: "جديد",
      emptyTitle: "لا توجد اختبارات",
      item: {
        duePrefix: "تسليم",
      },
    },

    // Schedule panel
    schedule: {
      title: "فترات الجدول",
      subtitle: "إنشاء + تفعيل/إيقاف + حذف",
      form: {
        day: "اليوم",
        from: "من",
        to: "إلى",
        group: "جماعي؟",
        max: "الحد",
      },
      modes: {
        oneToOne: "فردي",
        group: "جماعي",
      },
      emptyTitle: "لا توجد فترات",
      offerings: {
        title: "التخصيصات",
        manage: "التخصيصات",
        empty: "لا توجد تخصيصات بعد",
        add: "إضافة تخصيص",
        remove: "إزالة التخصيص",
        save: "حفظ التخصيصات",
        cancel: "إلغاء",
        subject: "المادة",
        system: "النظام",
        stage: "المرحلة",
        grade: "الصف",
        allGradesInStage: "كل الصفوف في هذه المرحلة",
        draftSlot: "فترة مسودة",
        liveSlot: "فترة منشورة",
        updated: "تم تحديث التخصيصات",
        loadError: "فشل تحميل التخصيصات",
        saveError: "فشل حفظ التخصيصات",
        oneOffering: "تخصيص واحد",
        manyOfferingsSuffix: "تخصيصات",
        stageWide: "على مستوى المرحلة",
      },
    },

    // Exceptions panel
    exceptions: {
      title: "استثناءات الجدول",
      subtitle: "إضافة يوم/فترة (حظر أو إضافة)",
      form: {
        date: "التاريخ",
        from: "من",
        to: "إلى",
        type: "النوع",
        group: "جماعي؟",
        note: "ملاحظة",
        reason: "سبب",
      },
      types: {
        block: "حظر",
        add: "إضافة",
      },
      emptyTitle: "لا توجد استثناءات",
    },

    // Videos panel
    videos: {
      title: "فيديوهات المعلم",
      subtitle: "إدارة فيديوهاتك التعليمية",
      emptyTitle: "لا توجد فيديوهات",
    },

    // Profile panel
    profile: {
      title: "الملف الشخصي",
      subtitle: "تحديث بسيط للبيانات الأساسية",
      fields: {
        name: "الاسم",
        phone: "الهاتف",
        bioShort: "نبذة قصيرة",
        photoUrl: "رابط الصورة",
      },

      videos: {
        title: "فيديوهات المعلم",
        subtitle: "إضافة/حذف/تعيين أساسي عبر اختيار المادة",
        subjectId: "المادة",
        videoUrl: "رابط الفيديو",
        primary: "أساسي؟",
        addVideo: "إضافة فيديو",
        emptyTitle: "لا توجد فيديوهات",
        note: "ملاحظة: اختر المادة من قائمة المواد المرتبطة بحسابك.",
      },
    },

    // Messages panel
    messages: {
      title: "الرسائل",
      subtitle: "إعلانات من الإدارة وصندوق إشعاراتك.",
      tabAnnouncements: "الإعلانات",
      tabNotifications: "الإشعارات",
      announcementsEmpty: "لا توجد إعلانات حالياً.",
      notificationsUnread: "غير مقروء",
      notificationsEmpty: "لا توجد إشعارات حالياً.",
      markRead: "تعليم كمقروء",
      markAllRead: "تعليم الكل كمقروء",
      typeLabel: "النوع",
      relatedLabel: "مرتبط بـ",
    },

    // Lesson requests panel
    lessonRequests: {
      title: "طلبات الحصص",
      subtitle: "طلبات الحصص المعلّقة من الطلاب وتنتظر موافقتك.",
      empty: "لا توجد طلبات حصص معلّقة.",
      loadError: "فشل تحميل طلبات الحصص.",
      student: "الطالب",
      subject: "المادة",
      time: "الوقت",
      requestedBy: "طلب بواسطة",
      approve: "موافقة",
      reject: "رفض",
      rejectReason: "السبب (اختياري)",
      rejectReasonPlaceholder: "مثال: غير متاح في هذا الوقت",
      confirmReject: "تأكيد الرفض",
      cancelReject: "إلغاء",
    },

    // Modals
    modals: {
      sessionDetails: {
        title: "تفاصيل الحصة",
        studentsAttendanceTitle: "الطلاب والحضور",
        studentsAttendanceSubtitle: "قم بتحديث حالة الحضور لكل طالب",
        emptyStudents: "لا يوجد طلاب",
      },

      homeworkModal: {
        newTitle: "واجب جديد",
        editTitle: "تعديل واجب",
        subjectIdHelp: "اختر المادة",
        dueAtLabel: "تاريخ التسليم (SQL)",
        titleLabel: "العنوان",
        descriptionLabel: "الوصف",
        maxScoreLabel: "الدرجة القصوى",
        attachmentsLabel: "مرفقات URL",
        statusLabel: "الحالة",
      },

      quizModal: {
        newTitle: "اختبار جديد",
        editTitle: "تعديل اختبار",
        subjectIdHelp: "اختر المادة",
        dueAtLabel: "تاريخ التسليم (SQL)",
        titleLabel: "العنوان",
        descriptionLabel: "الوصف",
        maxScoreLabel: "الدرجة القصوى",
        quizUrlLabel: "Quiz URL",
        statusLabel: "الحالة",
      },

      submissions: {
        titleFallback: "التسليمات",
        emptyTitle: "لا توجد تسليمات",
        statusPrefix: "الحالة",
      },

      grade: {
        title: "تقييم",
        typePrefix: "نوع",
        submissionIdPrefix: "Submission ID",
        scoreLabel: "الدرجة",
        feedbackLabel: "ملاحظات",
        feedbackPlaceholder: "اختياري",
      },
    },
  },
} as const;
