// src/routes/moderator.routes.js
// ============================================================================
// Moderator Routes (SESSION-ONLY)
// ============================================================================

import { Router } from "express";
import { requireModeratorSession } from "../middlewares/moderator.js";

import {
  getModeratorLessonSessions,
  getModeratorSessionStudents,
  markAttendanceExcused,
  getModeratorStudents,
  getModeratorTeachers,
  getModeratorHomework,
  getModeratorQuizzes,
} from "../controllers/moderator.controller.js";

const router = Router();

// All moderator routes require a valid moderator session
router.use(requireModeratorSession);

/* ============================================================================ */
/* LESSON SESSIONS                                                               */
/* ============================================================================ */

router.get("/lesson-sessions", getModeratorLessonSessions);
router.get("/lesson-sessions/:sessionId/students", getModeratorSessionStudents);

/* ============================================================================ */
/* ATTENDANCE — excused only                                                     */
/* ============================================================================ */

router.patch("/lesson-sessions/:sessionId/attendance", markAttendanceExcused);

/* ============================================================================ */
/* STUDENTS                                                                      */
/* ============================================================================ */

router.get("/students", getModeratorStudents);

/* ============================================================================ */
/* TEACHERS                                                                      */
/* ============================================================================ */

router.get("/teachers", getModeratorTeachers);

/* ============================================================================ */
/* HOMEWORK                                                                      */
/* ============================================================================ */

router.get("/homework", getModeratorHomework);

/* ============================================================================ */
/* QUIZZES                                                                       */
/* ============================================================================ */

router.get("/quizzes", getModeratorQuizzes);

export default router;
