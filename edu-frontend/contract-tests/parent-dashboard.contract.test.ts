import type {
  AnnouncementRow,
  ParentRequestRow,
  ParentStudentRow,
  StudentSelectionRow,
} from "../src/services/parentService";
import {
  mapAnnouncementRow,
  mapRequestRow,
  mapSelectionRow,
  mapStudentRow,
  requireData,
} from "../src/app/parent/dashboard/parentDashboardMappers";
import type {
  ParentRequest,
  ParentSelection,
  ParentStudent,
} from "../src/app/parent/dashboard/parentDashboardTypes";

const parentStudentRowFixture: ParentStudentRow = {
  link_id: 1,
  student_id: 7,
  student_name: "Student One",
  system_id: 2,
  stage_id: 3,
  grade_level_id: 4,
  system_name: "National",
  stage_name: "Primary",
  grade_level_name: "Grade 4",
  relationship: "mother",
  has_own_login: 1,
  student_user_id: 99,
};

const selectionRowFixture: StudentSelectionRow = {
  id: 10,
  subject_id: 20,
  subject_name_ar: "رياضيات",
  subject_name_en: "Mathematics",
  teacher_id: 30,
  teacher_name: "Teacher One",
  photo_url: null,
};

const requestRowFixture: ParentRequestRow = {
  id: 11,
  student_id: 7,
  student_name: "Student One",
  subject_id: 20,
  subject_name_ar: "رياضيات",
  subject_name_en: "Mathematics",
  current_teacher_id: 30,
  current_teacher_name: "Teacher One",
  requested_teacher_id: 31,
  requested_teacher_name: "Teacher Two",
  status: "pending",
  reason: "schedule fit",
  created_at: "2026-01-02T10:00:00Z",
};

const announcementFixture: AnnouncementRow = {
  id: 9,
  title: "Notice",
  body: "Body",
  audience: "parents",
  createdAt: "2026-01-02T10:00:00Z",
};

const mappedStudent: ParentStudent = mapStudentRow(parentStudentRowFixture);
const mappedSelection: ParentSelection = mapSelectionRow(selectionRowFixture);
const mappedRequest: ParentRequest = mapRequestRow(requestRowFixture);
const mappedAnnouncement = mapAnnouncementRow(announcementFixture);

const requiredDataResult = requireData({
  success: true,
  data: [selectionRowFixture],
});

export {
  mappedStudent,
  mappedSelection,
  mappedRequest,
  mappedAnnouncement,
  requiredDataResult,
};
