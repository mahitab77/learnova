// src/app/admin/dashboard/adminTexts.ts
// ============================================================================
// Admin Dashboard i18n Texts
// ----------------------------------------------------------------------------
// Responsibilities:
//  - Provide all English & Arabic labels, messages, and tab titles used
//    throughout the admin dashboard.
//  - Export Texts / LangTexts types so panels and hooks can be strongly typed.
// ============================================================================

import type { Lang } from "./adminTypes";

export const texts = {
  en: {
    pageTitle: "Admin Dashboard",
    pageSubtitle:
      "Manage subjects, teachers, parent change requests, and users from a single place.",
    notAdminTitle: "Access restricted",
    notAdminBody:
      "You must be an admin user to view this dashboard. Please log in with an admin account.",

    // ========================================================================
    // TABS - UPDATED WITH "NOTIFICATIONS" TAB ADDED
    // ========================================================================
    tabs: [
      "Overview",
      "Subjects",
      "Teachers",
      "Approvals",
      "Assignments",
      "Schedules",
      "Sessions",
      "Announcements",
      "Notifications", // ✅ NEW: Notifications tab for admin inbox
      "Requests",
      "Users",
      "Moderators", // ✅ Moderator management
      "Settings"
    ] as const,

    // Common actions
    retry: "Retry",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    add: "Add",
    loading: "Loading...",
    update: "Update",
    search: "Search",
    sort: "Sort By",
    refresh: "Refresh",
    // ========================================================================
    // OVERVIEW PANEL
    // ========================================================================
    overviewTitle: "Dashboard Overview",
    overviewDesc: "Quick overview of system statistics and key metrics",
    overviewStudents: "Active Students",
    overviewParents: "Active Parents", 
    overviewTeachers: "Active Teachers",
    overviewSubjects: "Subjects",
    overviewPendingRequests: "Pending Requests",
    overviewPendingApprovals: "Pending Approvals",
    overviewQuickActions: "Quick Actions",
    overviewViewReports: "View Reports",
    overviewManageUsers: "Manage Users", 
    overviewSystemSettings: "System Settings",

    // ========================================================================
    // TEACHER APPROVALS PANEL
    // ========================================================================
    approvalsTitle: "Teacher Approvals",
    approvalsDesc: "Review and approve pending teacher applications",
    approvalsNone: "No pending teacher approvals",
    approvalsPending: "Pending Review",
    approvalsApprove: "Approve",
    approvalsReject: "Reject", 
    approvalsApproving: "Approving...",
    approvalsRejecting: "Rejecting...",
    approvalsNotesPlaceholder: "Approval notes (optional)",
    approvalsCapacityPlaceholder: "Capacity",
    approvalsSetCapacity: "Set Capacity",

    // ========================================================================
    // ASSIGNMENTS PANEL  
    // ========================================================================
    assignmentsTitle: "Teacher Assignments",
    assignmentsDesc: "Manage teacher workloads and student assignments",
    assignmentsNone: "No assignments found",
    assignmentsFilterBySubject: "Filter by subject",
    assignmentsAllSubjects: "All subjects",
    assignmentsCurrentLoad: "Current Load",
    assignmentsMaxCapacity: "Max Capacity", 
    assignmentsUtilization: "Utilization",
    assignmentsUnlimited: "Unlimited",
    assignmentsAtCapacity: "At Capacity",
    assignmentsReassign: "Reassign",
    assignmentsReassigning: "Reassigning...",

    // ========================================================================
    // SCHEDULES PANEL
    // ========================================================================
    schedulesTitle: "Teacher Schedules",
    schedulesDesc: "Manage teacher timetables and availability",
    schedulesNone: "No schedules found",
    schedulesNoneForDay: "No schedules for this day",
    schedulesAllDays: "All Days",
    schedulesCreateNew: "Create New Schedule",
    schedulesTeacher: "Teacher ID",
    schedulesDay: "Day",
    schedulesStartTime: "Start Time",
    schedulesEndTime: "End Time", 
    schedulesGroupSession: "Group Session",
    schedulesMaxStudents: "Max Students",
    schedulesGroup: "Group",
    schedulesCreate: "Create Schedule",
    schedulesSessionType: "Session Type",

    // ========================================================================
    // ANNOUNCEMENTS PANEL
    // ========================================================================
    announcementsTitle: "Announcements",
    announcementsDesc: "Create and manage system announcements",
    announcementsNone: "No announcements found",
    announcementsCreateNew: "Create New Announcement",
    announcementsTitlePlaceholder: "Announcement title",
    announcementsBodyPlaceholder: "Announcement content",
    announcementsAudience: "Audience",
    announcementsAudienceAll: "All Users",
    announcementsAudienceStudents: "Students Only", 
    announcementsAudienceParents: "Parents Only",
    announcementsAudienceTeachers: "Teachers Only",
    announcementsCreate: "Create Announcement",
    announcementsBodyLabel: "Content",

    // ========================================================================
    // NOTIFICATIONS PANEL - NEW
    // ========================================================================
    notificationsTitle: "Notifications",
    notificationsDesc: "Review system notifications and track unread updates.",
    notificationsNone: "No notifications found.",
    notificationsLoading: "Loading notifications...",
    notificationsUnreadBadge: "Unread",
    notificationsMarkRead: "Mark read",
    notificationsMarkAllRead: "Mark all read",
    notificationsNoUnread: "No unread notifications",
    notificationsRefresh: "Refresh",
    notificationsType: "Type",
    notificationsRelated: "Related",
    notificationsCreatedAt: "Created at",

    // ========================================================================
    // COMBINED PANEL TITLE (Optional enhancement)
    // ========================================================================
    announcementsAndNotificationsTitle: "Announcements & Notifications",
    announcementsAndNotificationsDesc: "Publish announcements and manage your notifications inbox.",

    // ========================================================================
    // SETTINGS PANEL
    // ========================================================================
    settingsTitle: "System Settings",
    settingsDesc: "Configure system-wide settings and preferences",
    settingsEdit: "Edit Settings",
    settingsSave: "Save Settings",
    settingsGradeLevels: "Grade Levels",
    settingsAddGradeLevel: "Add grade level...",
    settingsNoGradeLevels: "No grade levels configured",
    settingsTermDates: "Term Dates", 
    settingsTermStart: "Term Start Date",
    settingsTermEnd: "Term End Date",
    settingsSystem: "System Settings",
    settingsDefaultLanguage: "Default Language",
    settingsAutoEmailTeachers: "Auto-email teachers on parent changes",

    // ========================================================================
    // Subjects (UPDATED with new keys)
    // ========================================================================
    subjectsTitle: "Subjects",
    subjectsDesc: "Create, edit and delete subjects.",
    subjectsAddNew: "Add new subject",
    subjectsNameAr: "Name (Arabic)",
    subjectsNameEn: "Name (English)",
    subjectsSortOrder: "Sort order",
    subjectsActive: "Active",
    subjectsCreate: "Create subject",
    subjectsCreating: "Creating...",
    subjectsUpdating: "Updating...", // NEW
    subjectsDeleting: "Deleting...", // NEW
    subjectsTableSubject: "Subject",
    subjectsTableOrder: "Order",
    subjectsTableStatus: "Status",
    subjectsStatusActive: "Active",
    subjectsStatusInactive: "Inactive",
    subjectsActions: "Actions",
    subjectsEdit: "Edit",
    subjectsDelete: "Delete",
    subjectsUpdate: "Update",
    subjectsCancel: "Cancel",
    subjectsLoading: "Loading subjects...",
    subjectsNone: "No subjects found.",
    subjectsError: "Failed to load subjects.",
    subjectsUpdateSuccess: "Subject updated.",
    subjectsDeleteConfirm: "Are you sure you want to delete this subject?",
    subjectsDeleteSuccess: "Subject deleted.",
    subjectsCreateError: "Failed to create subject", // NEW
    subjectsUpdateError: "Failed to update subject", // NEW
    subjectsDeleteError: "Failed to delete subject", // NEW

    subjectsFilterStatusLabel: "Status",
    subjectsFilterStatusAll: "All",
    subjectsSortLabel: "Sort by",
    subjectsSortOrderAsc: "Sort order (ascending)",
    subjectsSortOrderDesc: "Sort order (descending)",
    subjectsSortNameAsc: "Name (A–Z)",
    subjectsSortNameDesc: "Name (Z–A)",

    // ========================================================================
    // Teachers (UPDATED with new keys)
    // ========================================================================
    teachersTitle: "Teachers",
    teachersDesc:
      "Create teachers, see their assigned subjects, and assign them to new subjects.",
    teachersLoading: "Loading teachers...",
    teachersNone: "No teachers found.",
    teachersError: "Failed to load teachers.",
    teachersTableName: "Name",
    teachersTableSubjects: "Subjects",
    teachersTableStatus: "Status",
    teachersStatusActive: "Active",
    teachersStatusInactive: "Inactive",
    teachersTableActions: "Actions",

    teachersAssignTitle: "Assign teacher to subject",
    teachersAssignSelectTeacher: "Select a teacher",
    teachersAssignSelectSubject: "Select a subject",
    teachersAssignPriority: "Priority (optional)",
    teachersAssignButton: "Assign",
    teachersAssignAssigning: "Assigning...",
    teachersAssignHint:
      "Priority is used if you show multiple teachers for the same subject.",
    teachersAssignSuccess: "Teacher assigned to subject.",
    teachersAssignError: "Failed to assign teacher.",
    teachersSubjectsLoading: "Loading subjects for assignment...",
    teachersSubjectsError: "Failed to load subjects for assignment.",

    teacherCreateTitle: "Add new teacher",
    teacherCreateName: "Name",
    teacherCreateBio: "Short bio (optional)",
    teacherCreateGender: "Gender (optional)",
    teacherCreatePhotoUrl: "Photo URL (optional)",
    teacherCreateIsActive: "Active",
    teacherCreateSubmit: "Create teacher",
    teacherCreateSubmitting: "Creating...",
    teacherCreateError: "Failed to create teacher.",
    teacherCreateSuccess: "Teacher created successfully.",

    teachersFilterStatusLabel: "Status",
    teachersFilterStatusAll: "All",
    teachersFilterStatusActive: "Active",
    teachersFilterStatusInactive: "Inactive",
    teachersFilterSubjectLabel: "Subject",
    teachersFilterSubjectAll: "All subjects",
    teachersSortLabel: "Sort by",
    teachersSortNameAsc: "Name (A–Z)",
    teachersSortNameDesc: "Name (Z–A)",
    teachersSortStatusDesc: "Status (Active first)",
    teachersSortStatusAsc: "Status (Inactive first)",

    // ========================================================================
    // Parent requests (existing - keep as is)
    // ========================================================================
    requestsTitle: "Parent change requests",
    requestsDesc:
      "Review and approve/reject parent requests to change a student's teacher.",
    requestsLoading: "Loading requests...",
    requestsNone: "No parent requests found.",
    requestsError: "Failed to load parent requests.",
    requestsTableParent: "Parent",
    requestsTableStudent: "Student",
    requestsTableSubject: "Subject",
    requestsTableCurrentTeacher: "Current teacher",
    requestsTableReason: "Reason",
    requestsTableStatus: "Status",
    requestsTableCreatedAt: "Created at",
    requestsTableActions: "Actions",
    requestsStatusPending: "Pending",
    requestsStatusApproved: "Approved",
    requestsStatusRejected: "Rejected",
    requestsApprove: "Approve",
    requestsReject: "Reject",
    requestsApproving: "Approving...",
    requestsRejecting: "Rejecting...",
    requestsApproveSuccess: "Request approved.",
    requestsRejectSuccess: "Request rejected.",

    requestsFilterStatusLabel: "Status",
    requestsFilterStatusAll: "All",
    requestsFilterStatusPending: "Pending only",
    requestsSearchLabel: "Search",
    requestsSearchPlaceholder: "Search by parent or student name...",
    requestsFilteredNone: "No requests match your filters.",

    // ========================================================================
    // Users tab (UPDATED with new keys)
    // ========================================================================
    usersTitle: "Users",
    usersDesc:
      "View and manage student and parent accounts. Activate or deactivate access and inspect basic info.",
    usersStudentsTitle: "Students",
    usersParentsTitle: "Parents",
    usersLoadingStudents: "Loading students...",
    usersLoadingParents: "Loading parents...",
    usersNoStudents: "No students found.",
    usersNoParents: "No parents found.",
    usersStudentsError: "Failed to load students.",
    usersParentsError: "Failed to load parents.",
    usersTableName: "Name",
    usersTableEmail: "Email",
    usersTableRole: "Role",
    usersTablePreferredLang: "Preferred language",
    usersTableStatus: "Status",
    usersTableCreatedAt: "Created at",
    usersTableActions: "Actions",
    usersStatusActive: "Active",
    usersStatusInactive: "Inactive",
    usersActionActivate: "Activate",
    usersActionDeactivate: "Deactivate",
    usersUpdatingStatus: "Updating status...",
    usersUpdateStatusError: "Failed to update user status.",

    usersLinksTitle: "Parent–Student links",
    usersLinksLoading: "Loading links…",
    usersLinksError: "Failed to load links.",
    usersLinksEmpty: "No parent–student links found.",
    usersLinksTableParent: "Parent",
    usersLinksTableStudent: "Student",
    usersLinksTableRelationship: "Relationship",
    usersLinksTableCreatedAt: "Created at",
    usersLinksTableActions: "Actions",
    usersLinksDelete: "Delete",
    usersLinksDeleting: "Deleting…",
    usersLinksReadOnly: "Read-only",
    usersLinksFormParentLabel: "Parent",
    usersLinksFormStudentLabel: "Student",
    usersLinksFormRelationshipLabel: "Relationship",
    usersLinksFormRelationshipMother: "Mother",
    usersLinksFormRelationshipFather: "Father",
    usersLinksFormRelationshipGuardian: "Guardian",
    usersLinksCreateButton: "Add link",
    usersLinksCreatingButton: "Creating link...",
  },

  ar: {
    pageTitle: "لوحة تحكم المشرف",
    pageSubtitle:
      "إدارة المواد والمعلمين وطلبات أولياء الأمور والمستخدمين من مكان واحد.",
    notAdminTitle: "وصول مقيّد",
    notAdminBody:
      "يجب أن تكون مستخدمًا بصلاحية مشرف لمشاهدة هذه الصفحة. برجاء تسجيل الدخول بحساب مشرف.",

    // ========================================================================
    // TABS - UPDATED WITH "NOTIFICATIONS" TAB ADDED
    // ========================================================================
    tabs: [
      "نظرة عامة",
      "المواد", 
      "المعلمون", 
      "الموافقات",
      "التعيينات",
      "الجداول",
      "الحصص    ",
      "الإعلانات",
      "الإشعارات", // ✅ NEW: تبويب الإشعارات لصندوق إشعارات المشرف
      "طلبات أولياء الأمور",
      "المستخدمون",
      "المشرفون المساعدون", // ✅ Moderator management
      "الإعدادات"
    ] as const,

    // Common actions
    retry: "إعادة المحاولة",
    edit: "تعديل",
    delete: "حذف", 
    cancel: "إلغاء",
    save: "حفظ",
    create: "إنشاء",
    add: "إضافة",
    loading: "جاري التحميل...",
    update: "تحديث",
    search: "بحث",
    sort: "ترتيب حسب",
    refresh: "تحديث",
    // ========================================================================
    // OVERVIEW PANEL
    // ========================================================================
    overviewTitle: "نظرة عامة على النظام",
    overviewDesc: "نظرة سريعة على إحصائيات النظام والمقاييس الرئيسية",
    overviewStudents: "الطلاب النشطون",
    overviewParents: "أولياء الأمور النشطون",
    overviewTeachers: "المعلمون النشطون", 
    overviewSubjects: "المواد",
    overviewPendingRequests: "الطلبات المعلقة",
    overviewPendingApprovals: "الموافقات المعلقة",
    overviewQuickActions: "إجراءات سريعة",
    overviewViewReports: "عرض التقارير",
    overviewManageUsers: "إدارة المستخدمين",
    overviewSystemSettings: "إعدادات النظام",

    // ========================================================================
    // TEACHER APPROVALS PANEL
    // ========================================================================
    approvalsTitle: "موافقات المعلمين",
    approvalsDesc: "مراجعة والموافقة على طلبات المعلمين المعلقة",
    approvalsNone: "لا توجد موافقات معلقة للمعلمين",
    approvalsPending: "قيد المراجعة",
    approvalsApprove: "موافقة",
    approvalsReject: "رفض",
    approvalsApproving: "جاري الموافقة...",
    approvalsRejecting: "جاري الرفض...", 
    approvalsNotesPlaceholder: "ملاحظات الموافقة (اختياري)",
    approvalsCapacityPlaceholder: "السعة",
    approvalsSetCapacity: "تعيين السعة",

    // ========================================================================
    // ASSIGNMENTS PANEL
    // ========================================================================
    assignmentsTitle: "تعيينات المعلمين",
    assignmentsDesc: "إدارة أحمال عمل المعلمين وتعيينات الطلاب",
    assignmentsNone: "لا توجد تعيينات",
    assignmentsFilterBySubject: "تصفية حسب المادة",
    assignmentsAllSubjects: "كل المواد",
    assignmentsCurrentLoad: "الحمل الحالي",
    assignmentsMaxCapacity: "أقصى سعة",
    assignmentsUtilization: "معدل الاستخدام", 
    assignmentsUnlimited: "غير محدود",
    assignmentsAtCapacity: "بالسعة القصوى",
    assignmentsReassign: "إعادة تعيين",
    assignmentsReassigning: "جاري إعادة التعيين...",

    // ========================================================================
    // SCHEDULES PANEL
    // ========================================================================
    schedulesTitle: "جداول المعلمين",
    schedulesDesc: "إدارة جداول المعلمين وتوفرهم",
    schedulesNone: "لا توجد جداول",
    schedulesNoneForDay: "لا توجد جداول لهذا اليوم",
    schedulesAllDays: "كل الأيام",
    schedulesCreateNew: "إنشاء جدول جديد",
    schedulesTeacher: "رقم المعلم",
    schedulesDay: "اليوم",
    schedulesStartTime: "وقت البدء",
    schedulesEndTime: "وقت الانتهاء",
    schedulesGroupSession: "جلسة جماعية",
    schedulesMaxStudents: "أقصى عدد للطلاب",
    schedulesGroup: "جماعي",
    schedulesCreate: "إنشاء الجدول",
    schedulesSessionType: "نوع الجلسة",

    // ========================================================================
    // ANNOUNCEMENTS PANEL
    // ========================================================================
    announcementsTitle: "الإعلانات",
    announcementsDesc: "إنشاء وإدارة إعلانات النظام",
    announcementsNone: "لا توجد إعلانات",
    announcementsCreateNew: "إنشاء إعلان جديد",
    announcementsTitlePlaceholder: "عنوان الإعلان",
    announcementsBodyPlaceholder: "محتوى الإعلان",
    announcementsAudience: "الجمهور",
    announcementsAudienceAll: "كل المستخدمين",
    announcementsAudienceStudents: "الطلاب فقط",
    announcementsAudienceParents: "أولياء الأمور فقط",
    announcementsAudienceTeachers: "المعلمون فقط", 
    announcementsCreate: "إنشاء الإعلان",
    announcementsBodyLabel: "المحتوى",

    // ========================================================================
    // NOTIFICATIONS PANEL - NEW
    // ========================================================================
    notificationsTitle: "الإشعارات",
    notificationsDesc: "مراجعة إشعارات النظام وتتبع غير المقروء منها.",
    notificationsNone: "لا توجد إشعارات.",
    notificationsLoading: "جاري تحميل الإشعارات...",
    notificationsUnreadBadge: "غير مقروء",
    notificationsMarkRead: "تحديد كمقروء",
    notificationsMarkAllRead: "تحديد الكل كمقروء",
    notificationsNoUnread: "لا توجد إشعارات غير مقروءة",
    notificationsRefresh: "تحديث",
    notificationsType: "النوع",
    notificationsRelated: "مرتبط بـ",
    notificationsCreatedAt: "تاريخ الإنشاء",

    // ========================================================================
    // COMBINED PANEL TITLE (Optional enhancement)
    // ========================================================================
    announcementsAndNotificationsTitle: "الإعلانات والإشعارات",
    announcementsAndNotificationsDesc: "نشر الإعلانات وإدارة صندوق الإشعارات.",

    // ========================================================================
    // SETTINGS PANEL
    // ========================================================================
    settingsTitle: "إعدادات النظام",
    settingsDesc: "تكوين الإعدادات العامة والتفضيلات للنظام",
    settingsEdit: "تعديل الإعدادات",
    settingsSave: "حفظ الإعدادات",
    settingsGradeLevels: "المستويات الدراسية",
    settingsAddGradeLevel: "إضافة مستوى دراسي...",
    settingsNoGradeLevels: "لا توجد مستويات دراسية مضافة",
    settingsTermDates: "مواعيد الفصل الدراسي",
    settingsTermStart: "تاريخ بداية الفصل",
    settingsTermEnd: "تاريخ نهاية الفصل",
    settingsSystem: "إعدادات النظام",
    settingsDefaultLanguage: "اللغة الافتراضية",
    settingsAutoEmailTeachers: "إرسال بريد إلكتروني تلقائي للمعلمين عند تغيير أولياء الأمور",

    // ========================================================================
    // Subjects (UPDATED with new keys)
    // ========================================================================
    subjectsTitle: "المواد",
    subjectsDesc: "إنشاء، تعديل، وحذف المواد.",
    subjectsAddNew: "إضافة مادة جديدة",
    subjectsNameAr: "الاسم (عربي)",
    subjectsNameEn: "الاسم (إنجليزي)",
    subjectsSortOrder: "ترتيب العرض",
    subjectsActive: "فعّالة",
    subjectsCreate: "إنشاء مادة",
    subjectsCreating: "جاري الإنشاء...",
    subjectsUpdating: "جاري التحديث...", // NEW
    subjectsDeleting: "جاري الحذف...", // NEW
    subjectsTableSubject: "المادة",
    subjectsTableOrder: "الترتيب",
    subjectsTableStatus: "الحالة",
    subjectsStatusActive: "فعّالة",
    subjectsStatusInactive: "غير فعّالة",
    subjectsActions: "إجراءات",
    subjectsEdit: "تعديل",
    subjectsDelete: "حذف",
    subjectsUpdate: "حفظ",
    subjectsCancel: "إلغاء",
    subjectsLoading: "جاري تحميل المواد...",
    subjectsNone: "لا توجد مواد.",
    subjectsError: "تعذر تحميل المواد.",
    subjectsUpdateSuccess: "تم تحديث المادة.",
    subjectsDeleteConfirm: "هل أنت متأكد من حذف هذه المادة؟",
    subjectsDeleteSuccess: "تم حذف المادة.",
    subjectsCreateError: "خطأ في إنشاء المادة", // NEW
    subjectsUpdateError: "خطأ في تحديث المادة", // NEW
    subjectsDeleteError: "خطأ في حذف المادة", // NEW

    subjectsFilterStatusLabel: "الحالة",
    subjectsFilterStatusAll: "الكل",
    subjectsSortLabel: "ترتيب حسب",
    subjectsSortOrderAsc: "ترتيب العرض (تصاعدي)",
    subjectsSortOrderDesc: "ترتيب العرض (تنازلي)",
    subjectsSortNameAsc: "الاسم (أ-ي)",
    subjectsSortNameDesc: "الاسم (ي-أ)",

    // ========================================================================
    // Teachers (UPDATED with new keys)
    // ========================================================================
    teachersTitle: "المعلمون",
    teachersDesc:
      "إنشاء معلمين، مشاهدة المواد المرتبطة بهم، وربطهم بمواد جديدة.",
    teachersLoading: "جاري تحميل المعلمين...",
    teachersNone: "لا يوجد معلمون.",
    teachersError: "تعذر تحميل المعلمين.",
    teachersTableName: "الاسم",
    teachersTableSubjects: "المواد",
    teachersTableStatus: "الحالة",
    teachersStatusActive: "فعّال",
    teachersStatusInactive: "غير فعّال",
    teachersTableActions: "إجراءات",

    teachersAssignTitle: "ربط معلم بمادة",
    teachersAssignSelectTeacher: "اختر معلمًا",
    teachersAssignSelectSubject: "اختر مادة",
    teachersAssignPriority: "الأولوية (اختياري)",
    teachersAssignButton: "ربط",
    teachersAssignAssigning: "جاري الربط...",
    teachersAssignHint:
      "يُستخدم رقم الأولوية إذا كان هناك أكثر من معلم لنفس المادة.",
    teachersAssignSuccess: "تم ربط المعلم بالمادة.",
    teachersAssignError: "تعذر ربط المعلم بالمادة.",
    teachersSubjectsLoading: "جاري تحميل المواد للربط...",
    teachersSubjectsError: "تعذر تحميل المواد للربط.",

    teacherCreateTitle: "إضافة معلم جديد",
    teacherCreateName: "الاسم",
    teacherCreateBio: "نبذة قصيرة (اختياري)",
    teacherCreateGender: "النوع (اختياري)",
    teacherCreatePhotoUrl: "رابط الصورة (اختياري)",
    teacherCreateIsActive: "فعّال",
    teacherCreateSubmit: "إنشاء معلم",
    teacherCreateSubmitting: "جاري الإنشاء...",
    teacherCreateError: "تعذر إنشاء المعلم.",
    teacherCreateSuccess: "تم إنشاء المعلم بنجاح.",

    teachersFilterStatusLabel: "الحالة",
    teachersFilterStatusAll: "الكل",
    teachersFilterStatusActive: "فعّال",
    teachersFilterStatusInactive: "غير فعّال",
    teachersFilterSubjectLabel: "المادة",
    teachersFilterSubjectAll: "كل المواد",
    teachersSortLabel: "ترتيب حسب",
    teachersSortNameAsc: "الاسم (أ-ي)",
    teachersSortNameDesc: "الاسم (ي-أ)",
    teachersSortStatusDesc: "الحالة (فعّال أولاً)",
    teachersSortStatusAsc: "الحالة (غير فعّال أولاً)",

    // ========================================================================
    // Parent requests (existing - keep as is)
    // ========================================================================
    requestsTitle: "طلبات تغيير من أولياء الأمور",
    requestsDesc:
      "مراجعة وقبول/رفض طلبات أولياء الأمور لتغيير معلم الطالب.",
    requestsLoading: "جاري تحميل الطلبات...",
    requestsNone: "لا توجد طلبات.",
    requestsError: "تعذر تحميل الطلبات.",
    requestsTableParent: "ولي الأمر",
    requestsTableStudent: "الطالب",
    requestsTableSubject: "المادة",
    requestsTableCurrentTeacher: "المعلم الحالي",
    requestsTableReason: "السبب",
    requestsTableStatus: "الحالة",
    requestsTableCreatedAt: "تاريخ الإنشاء",
    requestsTableActions: "إجراءات",
    requestsStatusPending: "قيد المراجعة",
    requestsStatusApproved: "مقبول",
    requestsStatusRejected: "مرفوض",
    requestsApprove: "قبول",
    requestsReject: "رفض",
    requestsApproving: "جاري القبول...",
    requestsRejecting: "جاري الرفض...",
    requestsApproveSuccess: "تم قبول الطلب.",
    requestsRejectSuccess: "تم رفض الطلب.",

    requestsFilterStatusLabel: "الحالة",
    requestsFilterStatusAll: "الكل",
    requestsFilterStatusPending: "قيد المراجعة فقط",
    requestsSearchLabel: "بحث",
    requestsSearchPlaceholder: "بحث باسم ولي الأمر أو الطالب...",
    requestsFilteredNone: "لا توجد طلبات مطابقة للفلاتر.",

    // ========================================================================
    // Users tab (UPDATED with new keys)
    // ========================================================================
    usersTitle: "المستخدمون",
    usersDesc:
      "عرض وإدارة حسابات الطلاب وأولياء الأمور. تفعيل أو إيقاف الوصول ومراجعة البيانات الأساسية.",
    usersStudentsTitle: "الطلاب",
    usersParentsTitle: "أولياء الأمور",
    usersLoadingStudents: "جاري تحميل بيانات الطلاب...",
    usersLoadingParents: "جاري تحميل بيانات أولياء الأمور...",
    usersNoStudents: "لا يوجد طلاب.",
    usersNoParents: "لا يوجد أولياء أمور.",
    usersStudentsError: "تعذر تحميل بيانات الطلاب.",
    usersParentsError: "تعذر تحميل بيانات أولياء الأمور.",
    usersTableName: "الاسم",
    usersTableEmail: "البريد الإلكتروني",
    usersTableRole: "الدور",
    usersTablePreferredLang: "اللغة المفضلة",
    usersTableStatus: "الحالة",
    usersTableCreatedAt: "تاريخ الإنشاء",
    usersTableActions: "إجراءات",
    usersStatusActive: "فعّال",
    usersStatusInactive: "غير فعّال",
    usersActionActivate: "تفعيل",
    usersActionDeactivate: "إيقاف",
    usersUpdatingStatus: "جاري تحديث الحالة...",
    usersUpdateStatusError: "تعذر تحديث حالة المستخدم.",

    usersLinksTitle: "روابط ولي الأمر بالطالب",
    usersLinksLoading: "جاري تحميل الروابط...",
    usersLinksError: "تعذر تحميل الروابط.",
    usersLinksEmpty: "لا توجد روابط بين أولياء الأمور والطلاب.",
    usersLinksTableParent: "ولي الأمر",
    usersLinksTableStudent: "الطالب",
    usersLinksTableRelationship: "العلاقة",
    usersLinksTableCreatedAt: "تاريخ الإنشاء",
    usersLinksTableActions: "إجراءات",
    usersLinksDelete: "حذف",
    usersLinksDeleting: "جاري الحذف...",
    usersLinksReadOnly: "للقراءة فقط",
    usersLinksFormParentLabel: "ولي الأمر",
    usersLinksFormStudentLabel: "الطالب",
    usersLinksFormRelationshipLabel: "العلاقة",
    usersLinksFormRelationshipMother: "الأم",
    usersLinksFormRelationshipFather: "الأب",
    usersLinksFormRelationshipGuardian: "ولي الأمر",
    usersLinksCreateButton: "إضافة رابط",
    usersLinksCreatingButton: "جاري إنشاء الرابط...",
  },
} as const;

export type Texts = typeof texts;
export type LangTexts = Texts[Lang];