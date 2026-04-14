/**
 * Bilingual Text Constants for Parent Dashboard
 * -----------------------------------------------------------------
 * Merged + cleaned version (single export).
 * Includes: overview, children, assignments, requests, account.
 * Fully consistent with all dashboard tab files.
 */

export const parentDashboardTexts = {
  en: {
    // Navigation
    navOverview: "Overview",
    navChildren: "Children",
    navAssignments: "Assignments",
    navRequests: "Requests",
    navAccount: "Account & Settings",
    navMessages: " Messages",

    // Overview
    overviewTitle: "Parent Dashboard Overview",
    overviewSubtitle:
      "A quick snapshot of your children, assignments, and requests.",
    overviewTotalChildren: "Total Children",
    overviewTotalAssignments: "Assignments",
    overviewTotalRequests: "Requests",
    overviewRecentActivity: "Recent Activity",
    overviewNoActivity:
      "No recent assignments or requests have been recorded yet.",

    // Children
    childrenTitle: "Your Children",
    childrenSubtitle:
      "View your linked children and their subject/teacher selections.",
    childrenSearchPlaceholder: "Search by child name...",
    childrenSortLabel: "Sort",
    childrenSortByName: "Name (A–Z)",
    childrenSortByGrade: "Grade",
    childrenNoRecords: "No children linked yet.",
    childrenHint:
      "Use the registration flow or contact support to add children.",
    childrenSelectionsTitle: "Subjects & Teachers",
    childrenSelectionsLoading: "Loading subject selections...",
    childrenSelectionsEmpty: "No subject selections yet for this child.",
    childrenSelectionsError: "Could not load subject selections.",
    childrenSelectionsTeacher: "Teacher",
    childrenActionRequestChange: "Request Change",
    childrenActionChooseTeacher: "Choose Teacher",
    childrenHideSelections: "Hide Selections",
    childrenViewSelections: "View Selections",

    // Assignments
    assignmentsTitle: "Assignments & Quizzes",
    assignmentsSubtitle:
      "Track homework, quizzes, and scores for your children.",
    assignmentsEmpty:
      "No assignments have been recorded yet for your children.",
    assignmentsStudentLabel: "Student",
    assignmentsSubjectLabel: "Subject",
    assignmentsTypeLabel: "Type",
    assignmentsTypeHomework: "Homework",
    assignmentsTypeQuiz: "Quiz",
    assignmentsScoreLabel: "Score",
    assignmentsDueLabel: "Due Date",
    assignmentsSubmittedLabel: "Submitted At",

    // Requests
    requestsTitle: "Change Requests",
    requestsSubtitle: "Follow up on subject or teacher change requests.",
    requestsEmpty: "No requests yet.",
    requestsStatusPending: "Pending",
    requestsStatusApproved: "Approved",
    requestsStatusRejected: "Rejected",
    requestsReason: "Reason",
    requestsCreatedAt: "Created At",

    messagesTitle: "Messages",
    messagesDescription: "Your announcements and notifications",
    announcementsTitle: "Announcements",
    announcementsEmpty: "No announcements yet.",
    notificationsTitle: "Notifications",
    notificationsEmpty: "No notifications.",
    notificationsNewBadge: "New",
    refreshButton: "Refresh",
    markAllReadButton: "Mark all read",
    markReadButton: "Mark read",
    markedReadButton: "Read",
    authErrorMessage: "You must be logged in as a parent.",

    // Account
    accountTitle: "Account Settings",
    accountSubtitle: "Account details and preferences will appear here soon.",
    accountSectionTitle: "Account & settings",
    accountSectionBody:
      "In the next phase, you will be able to update your profile information, contact preferences, and notification settings here.",

    // Errors
    loadError: "Failed to load data.",
    missingId: "Missing user ID in development mode.",

    // Choose Teacher
    chooseTeacherTitle: "Choose a Teacher",
    chooseTeacherSubtitle:
      "Select an available teacher for this subject to send a change request.",
  },

  ar: {
    // Navigation
    navOverview: "نظرة عامة",
    navChildren: "الأبناء",
    navAssignments: "الواجبات والاختبارات",
    navRequests: "الطلبات",
    navAccount: "الحساب والإعدادات",
    navMessages: "الرسائل",

    // Overview
    overviewTitle: "نظرة عامة لولي الأمر",
    overviewSubtitle: "ملخص سريع لأبنائك والواجبات والطلبات.",
    overviewTotalChildren: "عدد الأبناء",
    overviewTotalAssignments: "الواجبات",
    overviewTotalRequests: "الطلبات",
    overviewRecentActivity: "آخر الأنشطة",
    overviewNoActivity: "لا توجد أنشطة حديثة.",

    // Children
    childrenTitle: "أبناؤك",
    childrenSubtitle: "اعرض الأبناء المرتبطين واختر المواد والمعلمين لكل منهم.",
    childrenSearchPlaceholder: "ابحث باسم الطالب...",
    childrenSortLabel: "ترتيب",
    childrenSortByName: "الاسم",
    childrenSortByGrade: "الصف",
    childrenNoRecords: "لا يوجد أبناء مرتبطون حتى الآن.",
    childrenHint: "استخدم صفحة التسجيل لإضافة المزيد من الأبناء.",
    childrenSelectionsTitle: "المواد والمعلمين",
    childrenSelectionsLoading: "جاري تحميل المواد...",
    childrenSelectionsEmpty: "لا توجد مواد لهذا الطالب.",
    childrenSelectionsError: "تعذر تحميل المواد.",
    childrenSelectionsTeacher: "المعلم",
    childrenActionRequestChange: "طلب تغيير",
    childrenActionChooseTeacher: "اختيار المعلم",
    childrenHideSelections: "إخفاء المواد",
    childrenViewSelections: "عرض المواد",

    // Assignments
    assignmentsTitle: "الواجبات والاختبارات",
    assignmentsSubtitle: "تابع الواجبات والاختبارات ودرجات أبنائك.",
    assignmentsEmpty: "لا توجد واجبات حالياً.",
    assignmentsStudentLabel: "الطالب",
    assignmentsSubjectLabel: "المادة",
    assignmentsTypeLabel: "النوع",
    assignmentsTypeHomework: "واجب",
    assignmentsTypeQuiz: "اختبار قصير",
    assignmentsScoreLabel: "الدرجة",
    assignmentsDueLabel: "تاريخ التسليم",
    assignmentsSubmittedLabel: "تاريخ الإرسال",

    // Requests
    requestsTitle: "طلبات التغيير",
    requestsSubtitle: "تابع حالة طلبات تغيير المواد أو المعلمين.",
    requestsEmpty: "لا توجد طلبات بعد.",
    requestsStatusPending: "قيد المراجعة",
    requestsStatusApproved: "مقبول",
    requestsStatusRejected: "مرفوض",
    requestsReason: "السبب",
    requestsCreatedAt: "تاريخ الإنشاء",
    // Messages

    messagesTitle: "الرسائل",
    messagesDescription: "الإعلانات والإشعارات الخاصة بك",
    announcementsTitle: "الإعلانات",
    announcementsEmpty: "لا توجد إعلانات حالياً.",
    notificationsTitle: "الإشعارات",
    notificationsEmpty: "لا توجد إشعارات.",
    notificationsNewBadge: "جديد",
    refreshButton: "تحديث",
    markAllReadButton: "تحديد الكل كمقروء",
    markReadButton: "تحديد كمقروء",
    markedReadButton: "مقروء",
    authErrorMessage: "يجب تسجيل الدخول كولي أمر.",
    // Account
    accountTitle: "إعدادات الحساب",
    accountSubtitle: "سيتم عرض تفاصيل الحساب قريباً.",
    accountSectionTitle: "الحساب والإعدادات",
    accountSectionBody:
      "في المرحلة التالية، ستتمكن من تعديل بياناتك الشخصية وتفضيلات التواصل وإعدادات الإشعارات من هنا.",

    // Errors
    loadError: "فشل في تحميل البيانات.",
    missingId: "لم يتم العثور على معرف المستخدم في وضع التطوير.",

    // Choose Teacher
    chooseTeacherTitle: "اختيار المعلم",
    chooseTeacherSubtitle: "اختر معلماً متاحاً لهذه المادة لإرسال طلب التغيير.",
  },
} as const;
