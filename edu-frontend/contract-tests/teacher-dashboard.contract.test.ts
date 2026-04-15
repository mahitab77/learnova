import {
  normalizeAnnouncementRow,
  normalizeTeacherInbox,
  normalizeTeacherSubjectRows,
} from "../src/app/teacher/dashboard/teacherDashboardMappers";
import type {
  TeacherAnnouncementRow,
  TeacherNotificationInbox,
  TeacherSubjectRow,
} from "../src/app/teacher/dashboard/teacherDashboardTypes";

const teacherSubjects = normalizeTeacherSubjectRows({
  success: true,
  data: [
    { subject_id: 1, name_en: "Mathematics", name_ar: "رياضيات" },
    { subject_id: 2, name_en: "Science", name_ar: "علوم" },
  ],
}) as TeacherSubjectRow[];

const normalizedAnnouncement: TeacherAnnouncementRow = normalizeAnnouncementRow({
  id: 100,
  title: "Announcement",
  body: "Body",
  audience: "teachers",
  createdAt: "2026-01-01T00:00:00Z",
});

const normalizedInbox: TeacherNotificationInbox = normalizeTeacherInbox({
  unreadCount: 1,
  items: [
    {
      id: 50,
      type: "system",
      title: "Title",
      body: "Body",
      relatedType: null,
      relatedId: null,
      isRead: false,
      readAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ],
});

export { teacherSubjects, normalizedAnnouncement, normalizedInbox };
