// src/routes/admin.routes.js
// ============================================================================
// Admin Dashboard Routes (PRODUCTION-READY / SESSION-ONLY)
// ============================================================================

import { Router } from "express";
import { requireAdminSession } from "../middlewares/admin.js";
import { validateRequest } from "../middlewares/requestValidation.js";
import {
  validateAdminApproveLesson,
  validateAdminCancelLesson,
  validateAdminIdParam,
  validateAdminTeacherAssign,
  validateAdminUserActivation,
  validateAdminCreateParentStudentLink,
  validateAdminReassignTeacher,
  validateAdminCreateSchedule,
  validateAdminUpdateSchedule,
} from "../validation/highRiskMutations.js";

import {
  // SUBJECTS
  getAllSubjectsAdmin,
  createSubjectAdmin,
  updateSubjectAdmin,
  deleteSubjectAdmin,

  // TEACHERS
  getAllTeachersAdmin,
  createTeacherAdmin,
  assignTeacherToSubjectAdmin,
  updateTeacherAdmin,

  // PARENT CHANGE REQUESTS
  getParentRequestsAdmin,
  approveParentRequestAdmin,
  rejectParentRequestAdmin,

  // USERS
  getAdminStudents,
  getAdminParents,
  activateUserAdmin,

  // PARENT ↔ STUDENT LINKS
  listParentStudentLinksAdmin,
  createParentStudentLinkAdmin,
  deleteParentStudentLinkAdmin,

  // TEACHER ONBOARDING / APPROVAL
  getPendingTeachersAdmin,
  approveTeacherAdmin,
  rejectTeacherAdmin,
  updateTeacherCapacityAdmin,

  // STUDENT–TEACHER ASSIGNMENTS
  getTeacherAssignmentsAdmin,
  reassignStudentTeacherAdmin,

  // TIMETABLE / SCHEDULES
  getTeacherSchedulesAdmin,
  createTeacherScheduleAdmin,
  updateTeacherScheduleAdmin,
  deleteTeacherScheduleAdmin,

  // NEW: admin schedule panel + create session
  adminGetTeacherSchedulePanel,
  adminCreateLessonSession,

  // ANNOUNCEMENTS
  getAnnouncementsAdmin,
  createAnnouncementAdmin,
  // NOTIFICATIONS (Admin inbox)
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,

  // OVERVIEW & SETTINGS
  getAdminOverview,
  getAdminSettings,
  updateAdminSettings,

  // Lesson requests governance
  getPendingLessonRequestsAdmin,
  approveLessonRequestAdmin,
  cancelLessonSessionAdmin,
  getAdminLessonSessionsAdmin,

  // MODERATOR MANAGEMENT
  getModeratorsAdmin,
  createModeratorAdmin,

  // SESSION MEETING INFO
  updateSessionMeetingAdmin,
} from "../controllers/admin.controller.js";
import {
  confirmPayment,
  failPayment,
} from "../controllers/payment.controller.js";
import {
  approveRefund,
  rejectRefund,
} from "../controllers/refund.controller.js";

const router = Router();

/**
 * -----------------------------------------------------------------------------
 * 🔒 Production Security Policy (Admin)
 * -----------------------------------------------------------------------------
 * Admin endpoints must be session-cookie authenticated ONLY.
 *
 * We enforce this using requireAdminSession:
 * - Session cookie is REQUIRED (no x-user-id dev header path)
 * - Then role === "admin" is enforced
 * -----------------------------------------------------------------------------
 */
router.use(requireAdminSession);

/* ============================================================================ */
/* SUBJECTS                                                                     */
/* ============================================================================ */

router.get("/subjects", getAllSubjectsAdmin);
router.post("/subjects", createSubjectAdmin);
router.put("/subjects/:id", validateRequest(validateAdminIdParam), updateSubjectAdmin);
router.delete("/subjects/:id", validateRequest(validateAdminIdParam), deleteSubjectAdmin);

/* ============================================================================ */
/* TEACHERS (basic CRUD + subjects)                                             */
/* ============================================================================ */

router.get("/teachers", getAllTeachersAdmin);
router.post("/teachers", createTeacherAdmin);
router.post("/teachers/:teacherId/assign", validateRequest(validateAdminTeacherAssign), assignTeacherToSubjectAdmin);
router.put("/teachers/:id", validateRequest(validateAdminIdParam), updateTeacherAdmin);

/* ============================================================================ */
/* TEACHER ONBOARDING / APPROVAL                                                */
/* ============================================================================ */

router.get("/teachers/pending", getPendingTeachersAdmin);
router.post("/teachers/:id/approve", validateRequest(validateAdminIdParam), approveTeacherAdmin);
router.post("/teachers/:id/reject", validateRequest(validateAdminIdParam), rejectTeacherAdmin);
router.put("/teachers/:id/capacity", validateRequest(validateAdminIdParam), updateTeacherCapacityAdmin);

/* ============================================================================ */
/* PARENT CHANGE REQUESTS                                                       */
/* ============================================================================ */

router.get("/parent-requests", getParentRequestsAdmin);
router.post("/parent-requests/:id/approve", validateRequest(validateAdminIdParam), approveParentRequestAdmin);
router.post("/parent-requests/:id/reject", validateRequest(validateAdminIdParam), rejectParentRequestAdmin);

/* ============================================================================ */
/* USERS (Students & Parents)                                                   */
/* ============================================================================ */

router.get("/students", getAdminStudents);
router.get("/parents", getAdminParents);
router.put("/users/:id/activate", validateRequest(validateAdminUserActivation), activateUserAdmin);

/* ============================================================================ */
/* PARENT ↔ STUDENT LINKS                                                       */
/* ============================================================================ */

router.get("/parent-student-links", listParentStudentLinksAdmin);
router.post("/parent-student-links", validateRequest(validateAdminCreateParentStudentLink), createParentStudentLinkAdmin);
router.delete("/parent-student-links/:id", validateRequest(validateAdminIdParam), deleteParentStudentLinkAdmin);

/* ============================================================================ */
/* STUDENT–TEACHER ASSIGNMENTS                                                  */
/* ============================================================================ */

router.get("/teacher-assignments", getTeacherAssignmentsAdmin);
router.post("/teacher-assignments/reassign", validateRequest(validateAdminReassignTeacher), reassignStudentTeacherAdmin);

/* ============================================================================ */
/* TIMETABLE / SCHEDULES                                                        */
/* ============================================================================ */

router.get("/schedules", getTeacherSchedulesAdmin);
router.post("/schedules", validateRequest(validateAdminCreateSchedule), createTeacherScheduleAdmin);
router.put("/schedules/:id", validateRequest(validateAdminUpdateSchedule), updateTeacherScheduleAdmin);
router.delete("/schedules/:id", validateRequest(validateAdminIdParam), deleteTeacherScheduleAdmin);

// Sessions list (existing)
router.get("/lesson-sessions", getAdminLessonSessionsAdmin);

/**
 * NEW (schedule sharing / management)
 * - GET schedule panel bundle (teacher slots + scopes + exceptions + sessions)
 * - POST create lesson session (must respect extra_available exception rules)
 */
router.get("/dashboard/teacher-schedule", adminGetTeacherSchedulePanel);
router.post("/dashboard/sessions", adminCreateLessonSession);

/* ============================================================================ */
/* ANNOUNCEMENTS                                                                */
/* ============================================================================ */

router.get("/announcements", getAnnouncementsAdmin);
router.post("/announcements", createAnnouncementAdmin);

/* ============================================================================ */
/* NOTIFICATIONS (Admin inbox)                                                  */
/* ============================================================================ */

router.get("/notifications", getAdminNotifications);
router.patch("/notifications/:id/read", markAdminNotificationRead);
router.patch("/notifications/read-all", markAllAdminNotificationsRead);

/* ============================================================================ */
/* OVERVIEW & SETTINGS                                                          */
/* ============================================================================ */

router.get("/overview", getAdminOverview);
router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);

// Lesson requests governance
router.get("/lesson-requests/pending", getPendingLessonRequestsAdmin);
router.post(
  "/lesson-requests/:id/approve",
  validateRequest(validateAdminApproveLesson),
  approveLessonRequestAdmin
);
router.post(
  "/lessons/:id/cancel",
  validateRequest(validateAdminCancelLesson),
  cancelLessonSessionAdmin
);

/* ============================================================================ */
/* SESSION MEETING INFO (Zoom + YouTube)                                         */
/* ============================================================================ */

router.patch("/lesson-sessions/:id/meeting", updateSessionMeetingAdmin);

/* ============================================================================ */
/* MODERATOR MANAGEMENT                                                          */
/* ============================================================================ */

router.get("/moderators", getModeratorsAdmin);
router.post("/moderators", createModeratorAdmin);

/* ============================================================================ */
/* BILLING GOVERNANCE (ADMIN MUTATIONS)                                         */
/* ============================================================================ */
router.post("/payments/:paymentId/confirm", confirmPayment);
router.post("/payments/:paymentId/fail", failPayment);
router.post("/payments/:paymentId/refund/approve", approveRefund);
router.post("/payments/:paymentId/refund/reject", rejectRefund);

export default router;
