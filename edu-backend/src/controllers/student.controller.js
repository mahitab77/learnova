
// src/controllers/student.controller.js
import pool from "../db.js";
import {
  academicScopeMatchesRow,
  buildAcademicScopeMatchSql,
  resolveStudentAcademicIds,
  subjectIsAvailableForScope,
  teacherHasLiveOfferingForScope,
} from "../utils/academicScope.js";
import {
  assertTeacherEligibleForSubjectScope,
  listEligibleTeacherIdsForSubjectScope,
} from "../services/teacherDiscovery.service.js";
import { upsertTeacherSelection } from "../services/teacherSelection.service.js";
import {
  getStudentContext,
  loadStudentSubjectTeacherBookingContext,
} from "../services/studentContext.service.js";
import {
  loadAvailableSubjectsForStudent,
  loadStudentSubjects,
  loadSubjectsForStudent,
} from "../services/studentSubjects.service.js";
import {
  isValidDateStr,
} from "../utils/cairoTime.js";
import {
  badRequest,
  buildStudentTeacherAvailabilityRequestContext,
  getAuthUserId,
  handleApiError,
  notFound,
  parsePositiveInt,
  unauthorized,
} from "./helpers/studentController.helpers.js";
import {
  loadAnnouncementsForStudent,
  loadAttendanceSummary,
  loadNotifications,
  loadPendingHomework,
  loadPendingQuizzes,
  loadRecentHomeworkGrades,
  loadRecentQuizGrades,
  loadUpcomingLessons,
} from "./helpers/studentDashboardReadModel.helpers.js";
import {
  cancelMyLessonRequestHandler,
  cancelMyScheduledSessionHandler,
  getMyPendingLessonRequestsHandler,
  requestLessonSessionHandler,
} from "./studentLessonRequests.controller.js";
export { buildStudentTeacherAvailabilityRequestContext };
export {
  getStudentLessonSessionRating,
  upsertStudentLessonSessionRating,
} from "./rating.controller.js";

/* =============================================================================
 * Student Controller (PRODUCTION READY - Session-Only Auth)
 * -----------------------------------------------------------------------------
 * Key production fixes:
 * ✅ All endpoints now use getStudentContext() to enforce active student role
 * ✅ Transaction safety improved (earlier BEGIN in requestLessonSession)
 * ✅ Overlap protection includes both teacher AND student
 * ✅ Notification system hardened against schema changes
 * ✅ Debug logs only in non-production environments
 * ✅ Consistent timezone handling for datetime operations
 * ============================================================================= */

/* =============================================================================
 * Environment & Configuration
 * ============================================================================= */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// =============================================================================
// Canonical scheduling datetime rules now live in src/utils/cairoTime.js.
// This controller still accepts naive "YYYY-MM-DD HH:MM:SS" transport strings
// that represent Cairo wall-clock time, but validation/normalization is shared.
// session timezone set consistently — no CONVERT_TZ is performed here;
// the application layer treats every "YYYY-MM-DD HH:MM:SS" value as Cairo.
// =============================================================================
const PLATFORM_TZ = "Africa/Cairo"; // informational — used in validation comments
const STUDENT_SCOPE_RESOLUTION_ERROR =
  "Student academic scope could not be resolved. Ensure students.system_id and students.stage_id are populated.";

/* =============================================================================
 * Notifications (PRODUCTION HARDENED)
 * ============================================================================= */

/* =============================================================================
 * Data loaders for dashboard + panels
 * ============================================================================= */

/* =============================================================================
 * Core endpoints: profile, dashboard, panels
 * ============================================================================= */

export const getStudentProfile = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const { user: userRow, student } = context;

    return res.json({
      success: true,
      data: {
        user: {
          id: userRow.id,
          fullName: userRow.full_name,
          preferredLang: userRow.preferred_lang,
        },
        student: {
          id: student.id,
          systemId: student.system_id != null ? Number(student.system_id) : null,
          stageId: student.stage_id != null ? Number(student.stage_id) : null,
          gradeLevelId: student.grade_level_id != null ? Number(student.grade_level_id) : null,
          // Legacy fields kept for response compatibility; canonical scope is IDs above.
          gradeStage: null,
          gradeNumber: null,
          gender: student.gender,
          onboardingCompleted: !!student.onboarding_completed,
        },
      },
    });
  } catch (err) {
    return handleApiError(res, err, "getStudentProfile");
  }
};

/**
 * PUT /student/scope
 * Writes normalized academic scope (system_id, stage_id, grade_level_id) for the
 * authenticated student. Validates that the provided IDs exist in the catalog
 * before writing. Called from the onboarding Step 0 scope-selector.
 */
export const updateStudentAcademicScope = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const systemId = parsePositiveInt(req.body?.systemId);
    const stageId = parsePositiveInt(req.body?.stageId);
    const gradeLevelId = req.body?.gradeLevelId != null
      ? parsePositiveInt(req.body.gradeLevelId)
      : null;

    if (!systemId || !stageId) {
      return badRequest(res, "systemId and stageId are required.");
    }

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    // Verify system + stage exist and belong together
    const [stageRows] = await pool.query(
      `SELECT id FROM grade_stages WHERE id = ? AND system_id = ? LIMIT 1`,
      [stageId, systemId]
    );
    if (!stageRows.length) {
      return badRequest(res, "Invalid systemId/stageId combination.");
    }

    // Verify grade level if provided
    if (gradeLevelId != null) {
      const [levelRows] = await pool.query(
        `SELECT id FROM grade_levels WHERE id = ? AND stage_id = ? LIMIT 1`,
        [gradeLevelId, stageId]
      );
      if (!levelRows.length) {
        return badRequest(res, "Invalid gradeLevelId for the given stageId.");
      }
    }

    await pool.query(
      `UPDATE students SET system_id = ?, stage_id = ?, grade_level_id = ? WHERE id = ?`,
      [systemId, stageId, gradeLevelId ?? null, context.student.id]
    );

    return res.json({
      success: true,
      message: "Academic scope saved.",
      data: { systemId, stageId, gradeLevelId: gradeLevelId ?? null },
    });
  } catch (err) {
    return handleApiError(res, err, "updateStudentAcademicScope");
  }
};

export const getStudentSubjects = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) {
      return notFound(res, "Active student profile not found for this user.");
    }

    const subjects = await loadSubjectsForStudent(context.student.id);
    return res.json({ success: true, data: subjects });
  } catch (err) {
    return handleApiError(res, err, "getStudentSubjects");
  }
};

export const getStudentSchedule = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const lessons = await loadUpcomingLessons(context.student.id);
    return res.json({ success: true, data: lessons });
  } catch (err) {
    return handleApiError(res, err, "getStudentSchedule");
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const summary = await loadAttendanceSummary(context.student.id);
    return res.json({ success: true, data: summary });
  } catch (err) {
    return handleApiError(res, err, "getStudentAttendance");
  }
};

export const getStudentHomework = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const homework = await loadPendingHomework(context.student.id);
    return res.json({ success: true, data: homework });
  } catch (err) {
    return handleApiError(res, err, "getStudentHomework");
  }
};

/**
 * GET /student/homework/:id
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export const getHomeworkDetail = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const homeworkId = parsePositiveInt(req.params?.id);
    if (!homeworkId) return badRequest(res, "Invalid homework id.");

    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found.");

    const student = context.student;
    let row = null;

    // Try richer query first (optional columns may not exist)
    try {
      const [[r]] = await pool.query(
        `
        SELECT
          ha.id,
          ha.title,
          ha.subject_id,
          subj.name_en AS subject_name_en,
          subj.name_ar AS subject_name_ar,
          ha.due_at,
          ha.max_score,
          ha.created_at,
          ha.is_active,

          ha.description,
          ha.instructions,
          ha.attachment_url,

          hs.id AS submission_id,
          hs.status AS submission_status,
          hs.score AS submission_score,
          hs.submitted_at,
          hs.file_url,
          hs.text_answer
        FROM homework_assignments ha
        INNER JOIN subjects subj ON subj.id = ha.subject_id
        LEFT JOIN homework_submissions hs
          ON hs.homework_id = ha.id
         AND hs.student_id  = ?
        WHERE ha.id = ?
        LIMIT 1
        `,
        [student.id, homeworkId]
      );
      row = r || null;
    } catch (err) {
      if (err && (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054)) {
        const [[r]] = await pool.query(
          `
          SELECT
            ha.id,
            ha.title,
            ha.subject_id,
            subj.name_en AS subject_name_en,
            subj.name_ar AS subject_name_ar,
            ha.due_at,
            ha.max_score,
            ha.is_active,

            hs.status AS submission_status,
            hs.score  AS submission_score
          FROM homework_assignments ha
          INNER JOIN subjects subj ON subj.id = ha.subject_id
          LEFT JOIN homework_submissions hs
            ON hs.homework_id = ha.id
           AND hs.student_id  = ?
          WHERE ha.id = ?
          LIMIT 1
          `,
          [student.id, homeworkId]
        );
        row = r || null;
      } else {
        throw err;
      }
    }

    if (!row) return notFound(res, "Homework not found.");
    if (row.is_active !== undefined && Number(row.is_active) !== 1) {
      return notFound(res, "Homework not found.");
    }

    // Must be enrolled in subject
    const [[enrolled]] = await pool.query(
      `
      SELECT 1
      FROM student_subjects
      WHERE student_id = ?
        AND subject_id = ?
      LIMIT 1
      `,
      [student.id, row.subject_id]
    );
    if (!enrolled) return badRequest(res, "Student is not enrolled in this subject.");

    return res.json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        subjectId: row.subject_id,
        subjectNameEn: row.subject_name_en,
        subjectNameAr: row.subject_name_ar,
        dueAt: row.due_at ?? null,
        maxScore: row.max_score ?? null,
        createdAt: row.created_at ?? null,

        description: row.description ?? null,
        instructions: row.instructions ?? null,
        attachmentUrl: row.attachment_url ?? null,

        submission:
          row.submission_id ||
          row.submission_status ||
          row.submission_score !== undefined
            ? {
                id: row.submission_id ?? null,
                status: row.submission_status ?? null,
                score: row.submission_score ?? null,
                submittedAt: row.submitted_at ?? null,
                fileUrl: row.file_url ?? null,
                textAnswer: row.text_answer ?? null,
              }
            : null,
      },
    });
  } catch (err) {
    return handleApiError(res, err, "getHomeworkDetail");
  }
};

export const getStudentQuizzes = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const quizzes = await loadPendingQuizzes(context.student.id);
    return res.json({ success: true, data: quizzes });
  } catch (err) {
    return handleApiError(res, err, "getStudentQuizzes");
  }
};

/**
 * GET /student/quizzes/:id
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export const getQuizDetail = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const quizId = parsePositiveInt(req.params?.id);
    if (!quizId) return badRequest(res, "Invalid quiz id.");

    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found.");

    const student = context.student;
    let row = null;

    // Try richer query first (optional columns may not exist)
    try {
      const [[r]] = await pool.query(
        `
        SELECT
          qa.id,
          qa.title,
          qa.subject_id,
          subj.name_en AS subject_name_en,
          subj.name_ar AS subject_name_ar,
          qa.available_from,
          qa.available_until,
          qa.max_score,
          qa.created_at,
          qa.is_active,

          qa.description,
          qa.instructions,

          qs.id AS submission_id,
          qs.status AS submission_status,
          qs.score AS submission_score,
          qs.started_at,
          qs.submitted_at
        FROM quiz_assignments qa
        INNER JOIN subjects subj ON subj.id = qa.subject_id
        LEFT JOIN quiz_submissions qs
          ON qs.quiz_id    = qa.id
         AND qs.student_id = ?
        WHERE qa.id = ?
        LIMIT 1
        `,
        [student.id, quizId]
      );
      row = r || null;
    } catch (err) {
      if (err && (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054)) {
        const [[r]] = await pool.query(
          `
          SELECT
            qa.id,
            qa.title,
            qa.subject_id,
            subj.name_en AS subject_name_en,
            subj.name_ar AS subject_name_ar,
            qa.available_from,
            qa.available_until,
            qa.max_score,
            qa.is_active,

            qs.status AS submission_status,
            qs.score  AS submission_score
          FROM quiz_assignments qa
          INNER JOIN subjects subj ON subj.id = qa.subject_id
          LEFT JOIN quiz_submissions qs
            ON qs.quiz_id    = qa.id
           AND qs.student_id = ?
          WHERE qa.id = ?
          LIMIT 1
          `,
          [student.id, quizId]
        );
        row = r || null;
      } else {
        throw err;
      }
    }

    if (!row) return notFound(res, "Quiz not found.");
    if (row.is_active !== undefined && Number(row.is_active) !== 1) {
      return notFound(res, "Quiz not found.");
    }

    // Must be enrolled in subject
    const [[enrolled]] = await pool.query(
      `
      SELECT 1
      FROM student_subjects
      WHERE student_id = ?
        AND subject_id = ?
      LIMIT 1
      `,
      [student.id, row.subject_id]
    );
    if (!enrolled) return badRequest(res, "Student is not enrolled in this subject.");

    return res.json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        subjectId: row.subject_id,
        subjectNameEn: row.subject_name_en,
        subjectNameAr: row.subject_name_ar,
        availableFrom: row.available_from ?? null,
        availableUntil: row.available_until ?? null,
        maxScore: row.max_score ?? null,
        createdAt: row.created_at ?? null,

        description: row.description ?? null,
        instructions: row.instructions ?? null,

        submission:
          row.submission_id ||
          row.submission_status ||
          row.submission_score !== undefined
            ? {
                id: row.submission_id ?? null,
                status: row.submission_status ?? null,
                score: row.submission_score ?? null,
                startedAt: row.started_at ?? null,
                submittedAt: row.submitted_at ?? null,
              }
            : null,
      },
    });
  } catch (err) {
    return handleApiError(res, err, "getQuizDetail");
  }
};

export const getStudentGrades = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const studentId = context.student.id;

    const [homeworkGrades, quizGrades] = await Promise.all([
      loadRecentHomeworkGrades(studentId),
      loadRecentQuizGrades(studentId),
    ]);

    return res.json({
      success: true,
      data: { homework: homeworkGrades, quizzes: quizGrades },
    });
  } catch (err) {
    return handleApiError(res, err, "getStudentGrades");
  }
};

export const getStudentAnnouncements = async (req, res) => {
  try {
    const announcements = await loadAnnouncementsForStudent();
    return res.json({ success: true, data: announcements });
  } catch (err) {
    return handleApiError(res, err, "getStudentAnnouncements");
  }
};

export const getStudentNotifications = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const notifications = await loadNotifications(userId);
    return res.json({ success: true, data: notifications });
  } catch (err) {
    return handleApiError(res, err, "getStudentNotifications");
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const id = parsePositiveInt(req.params?.id);
    if (!id) return badRequest(res, "Invalid notification id.");

    const [result] = await pool.query(
      `
      UPDATE notifications
      SET is_read = 1,
          read_at = NOW()
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    if (result.affectedRows === 0) return notFound(res, "Notification not found.");

    return res.json({ success: true, message: "Notification marked as read." });
  } catch (err) {
    return handleApiError(res, err, "markNotificationRead");
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    await pool.query(
      `
      UPDATE notifications
      SET is_read = 1,
          read_at = NOW()
      WHERE user_id = ?
        AND is_read = 0
      `,
      [userId]
    );

    return res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    return handleApiError(res, err, "markAllNotificationsRead");
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const { user: userRow, student } = context;

    const [
      subjects,
      upcomingLessons,
      attendanceSummary,
      pendingHomework,
      pendingQuizzes,
      recentHomeworkGrades,
      recentQuizGrades,
      announcements,
      notifications,
    ] = await Promise.all([
      loadStudentSubjects(student.id),
      loadUpcomingLessons(student.id),
      loadAttendanceSummary(student.id),
      loadPendingHomework(student.id),
      loadPendingQuizzes(student.id),
      loadRecentHomeworkGrades(student.id),
      loadRecentQuizGrades(student.id),
      loadAnnouncementsForStudent(),
      loadNotifications(userRow.id),
    ]);

    return res.json({
      success: true,
      data: {
        user: {
          id: userRow.id,
          fullName: userRow.full_name,
          preferredLang: userRow.preferred_lang,
        },
        student: {
          id: student.id,
          systemId: student.system_id != null ? Number(student.system_id) : null,
          stageId: student.stage_id != null ? Number(student.stage_id) : null,
          gradeLevelId: student.grade_level_id != null ? Number(student.grade_level_id) : null,
          // Legacy fields kept for response compatibility; canonical scope is IDs above.
          gradeStage: null,
          gradeNumber: null,
          gender: student.gender,
          onboardingCompleted: !!student.onboarding_completed,
        },
        subjects,
        upcomingLessons,
        attendanceSummary,
        pendingHomework,
        pendingQuizzes,
        recentGrades: {
          homework: recentHomeworkGrades,
          quizzes: recentQuizGrades,
        },
        announcements,
        notifications,
      },
    });
  } catch (err) {
    return handleApiError(res, err, "getStudentDashboard");
  }
};

/* =============================================================================
 * Subject Management
 * ============================================================================= */

export const getStudentAvailableSubjects = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const context = await getStudentContext(userId);
    if (!context) {
      return notFound(res, "Active student profile not found for this user.");
    }

    const { student } = context;

    const { systemId, stageId, gradeLevelId } = await resolveStudentAcademicIds(student);

    if (!systemId || !stageId) {
      return badRequest(res, STUDENT_SCOPE_RESOLUTION_ERROR);
    }

    const availableSubjects = await loadAvailableSubjectsForStudent(
      student.id,
      systemId,
      stageId,
      gradeLevelId
    );

    return res.json({ success: true, data: availableSubjects });
  } catch (err) {
    return handleApiError(res, err, "getStudentAvailableSubjects");
  }
};

export const updateStudentSubjects = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);

  const { subjectIds } = req.body || {};

  // ---------------------------------------------------------------------------
  // Validate input
  // ---------------------------------------------------------------------------
  if (!Array.isArray(subjectIds)) {
    return badRequest(res, "subjectIds must be an array of numbers.");
  }

  const cleanIds = [...new Set(subjectIds)]
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (cleanIds.length === 0) {
    return badRequest(res, "No valid subjectIds provided.");
  }

  const conn = await pool.getConnection();
  let txStarted = false;

  try {
    // ✅ Strong guard: active user + student role + student profile exists
    const context = await getStudentContext(userId, conn);
    if (!context) {
      return notFound(res, "Active student profile not found for this user.");
    }

    // -------------------------------------------------------------------------
    // Start transaction
    // -------------------------------------------------------------------------
    await conn.beginTransaction();
    txStarted = true;

    const student = context.student;
    const studentId = student.id;

    // Resolve academic scope (system/stage/grade_level) using same connection
    const { systemId, stageId, gradeLevelId } = await resolveStudentAcademicIds(student, conn);

    if (!systemId || !stageId) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, STUDENT_SCOPE_RESOLUTION_ERROR);
    }

    const scopeMatch = buildAcademicScopeMatchSql(
      { systemId, stageId, gradeLevelId },
      {
        systemColumn: "sa.system_id",
        stageColumn: "sa.stage_id",
        gradeLevelColumn: "sa.grade_level_id",
      }
    );

    const [allowedRows] = await conn.query(
      `
      SELECT sa.subject_id
      FROM subject_availability sa
      INNER JOIN subjects s ON s.id = sa.subject_id
      WHERE sa.subject_id IN (?)
        AND sa.is_active = 1
        AND s.is_active  = 1
        AND ${scopeMatch.sql}
      `,
      [cleanIds, ...scopeMatch.params]
    );

    const allowedIds = (allowedRows || [])
      .map((r) => Number(r.subject_id))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (allowedIds.length === 0) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "None of the requested subjects are available for this student.");
    }

    const allowedSet = new Set(allowedIds);
    const desiredIds = cleanIds.filter((id) => allowedSet.has(id));

    // Current subjects
    const [currentRows] = await conn.query(
      `
      SELECT subject_id
      FROM student_subjects
      WHERE student_id = ?
      `,
      [studentId]
    );

    const currentIds = (currentRows || [])
      .map((r) => Number(r.subject_id))
      .filter((n) => Number.isInteger(n) && n > 0);

    // ✅ FIXED: Clean and correct toRemove calculation
    const currentSet = new Set(currentIds);
    const desiredSet = new Set(desiredIds);

    const toAdd = desiredIds.filter((id) => !currentSet.has(id));
    const toRemove = currentIds.filter((id) => !desiredSet.has(id));

    // -------------------------------------------------------------------------
    // Apply changes
    // -------------------------------------------------------------------------
    if (toAdd.length > 0) {
      const values = toAdd.map((sid) => [studentId, sid]);
      await conn.query(
        `
        INSERT INTO student_subjects (student_id, subject_id)
        VALUES ?
        `,
        [values]
      );
    }

    if (toRemove.length > 0) {
      await conn.query(
        `
        DELETE FROM student_subjects
        WHERE student_id = ?
          AND subject_id IN (?)
        `,
        [studentId, toRemove]
      );

      // Deactivate active teacher selections for removed subjects
      await conn.query(
        `
        UPDATE student_teacher_selections
        SET status = 'replaced'
        WHERE student_id = ?
          AND subject_id IN (?)
          AND status = 'active'
        `,
        [studentId, toRemove]
      );
    }

    // Mark onboarding complete if they have at least one subject selected
    if (desiredIds.length > 0) {
      await conn.query(`UPDATE students SET onboarding_completed = 1 WHERE id = ?`, [studentId]);
    }

    await conn.commit();
    txStarted = false;

    // Reload updated subject list (fresh response)
    const updatedSubjects = await loadSubjectsForStudent(studentId);

    return res.json({
      success: true,
      message: "Student subjects updated.",
      data: updatedSubjects,
    });
  } catch (err) {
    if (txStarted) {
      try {
        await conn.rollback();
      } catch (_) {}
    }
    return handleApiError(res, err, "updateStudentSubjects");
  } finally {
    conn.release();
  }
};

/* =============================================================================
 * Teacher Selection & Lookup
 * ============================================================================= */

/**
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export const selectTeacherForSubject = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);

  const subjectId = parsePositiveInt(req.body?.subjectId);
  const teacherId = parsePositiveInt(req.body?.teacherId);

  if (!subjectId || !teacherId) {
    return badRequest(res, "subjectId and teacherId are required.");
  }

  try {
    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found for this user.");

    const student = context.student;

    const [subjectRows] = await pool.query(`SELECT id FROM subjects WHERE id = ? LIMIT 1`, [
      subjectId,
    ]);
    if (!subjectRows.length) return badRequest(res, "Subject not found.");

    const [enrollmentRows] = await pool.query(
      `SELECT id FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1`,
      [student.id, subjectId]
    );
    if (!enrollmentRows.length) return badRequest(res, "Student is not enrolled in this subject.");

    const eligibility = await assertTeacherEligibleForSubjectScope(
      teacherId,
      student,
      subjectId,
      { actorType: "student" }
    );
    if (!eligibility.ok) {
      return res.status(eligibility.status).json({
        success: false,
        message: eligibility.message,
      });
    }

    await upsertTeacherSelection(pool, {
      studentId: student.id,
      subjectId,
      teacherId,
      selectedBy: "student",
    });

    await pool.query(`UPDATE students SET onboarding_completed = 1 WHERE id = ?`, [student.id]);

    return res.json({
      success: true,
      message: "Teacher selected for subject.",
      data: { studentId: student.id, subjectId, teacherId },
    });
  } catch (err) {
    return handleApiError(res, err, "selectTeacherForSubject");
  }
};

/**
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export const getMySelections = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found.");

    const student = context.student;

    const [rows] = await pool.query(
      `
      SELECT 
        sts.id,
        sts.subject_id,
        s.name_ar AS subject_name_ar,
        s.name_en AS subject_name_en,
        sts.teacher_id,
        t.name AS teacher_name,
        t.photo_url,
        sts.status,
        sts.selected_by,
        sts.selected_at
      FROM student_teacher_selections sts
      INNER JOIN subjects s ON s.id = sts.subject_id
      INNER JOIN teachers t ON t.id = sts.teacher_id
      WHERE sts.student_id = ?
        AND sts.status = 'active'
      ORDER BY s.sort_order, s.id
      `,
      [student.id]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    return handleApiError(res, err, "getMySelections");
  }
};

/**
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export const getTeachersForSubject = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);

  const subjectId = parsePositiveInt(req.query?.subjectId);
  if (!subjectId) return badRequest(res, "subjectId is required and must be a valid number.");

  try {
    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found.");

    const student = context.student;

    const [enrollmentRows] = await pool.query(
      `
      SELECT id
      FROM student_subjects
      WHERE student_id = ?
        AND subject_id = ?
      LIMIT 1
      `,
      [student.id, subjectId]
    );
    if (!enrollmentRows.length) return badRequest(res, "Student is not enrolled in this subject.");

    const eligibleTeachers = await listEligibleTeacherIdsForSubjectScope(
      student,
      subjectId,
      { actorType: "student" }
    );
    if (!eligibleTeachers.ok) {
      return res.status(eligibleTeachers.status).json({
        success: false,
        message: eligibleTeachers.message,
      });
    }

    const { teacherIds: eligibleTeacherIds } = eligibleTeachers;

    if (!eligibleTeacherIds.length) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await pool.query(
      `
      SELECT DISTINCT
        t.id,
        COALESCE(NULLIF(t.name, ''), NULLIF(u.full_name, ''), CONCAT('Teacher #', t.id)) AS name,
        ROUND(AVG(tr.stars), 1) AS rating_avg,
        COUNT(tr.id) AS rating_count
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id
      LEFT JOIN teacher_ratings tr ON tr.teacher_id = t.id AND tr.is_hidden = 0
      WHERE t.id IN (?)
        AND t.is_active = 1
        AND t.status = 'approved'
        AND u.is_active = 1
        AND u.role = 'teacher'
      GROUP BY t.id, u.full_name, t.name
      ORDER BY name ASC, t.id ASC
      `,
      [eligibleTeacherIds]
    );

    return res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        rating_avg: r.rating_avg !== null && r.rating_avg !== undefined ? Number(r.rating_avg) : null,
        rating_count: Number(r.rating_count || 0),
      })),
    });
  } catch (err) {
    return handleApiError(res, err, "getTeachersForSubject");
  }
};

/**
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export const getTeacherDetailsForStudent = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);

  const teacherId = parsePositiveInt(req.params?.teacherId);
  if (!teacherId) return badRequest(res, "teacherId must be a valid number.");

  const subjectIdRaw = req.query?.subjectId;
  const subjectId = subjectIdRaw !== undefined ? parsePositiveInt(subjectIdRaw) : null;
  const hasSubjectId = subjectId !== null;

  try {
    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Student profile not found.");

    const student = context.student;

    if (hasSubjectId) {
      const [enrollRows] = await pool.query(
        `
        SELECT id
        FROM student_subjects
        WHERE student_id = ?
          AND subject_id = ?
        LIMIT 1
        `,
        [student.id, subjectId]
      );
      if (!enrollRows.length) return badRequest(res, "Student is not enrolled in this subject.");

      const { systemId, stageId, gradeLevelId } = await resolveStudentAcademicIds(student);
      if (!systemId || !stageId) {
        return badRequest(res, STUDENT_SCOPE_RESOLUTION_ERROR);
      }

      const subjectAllowed = await subjectIsAvailableForScope(
        subjectId,
        systemId,
        stageId,
        gradeLevelId
      );
      if (!subjectAllowed) {
        return badRequest(
          res,
          "This subject is not available for the student's academic level."
        );
      }

      const teacherMatchesScope = await teacherHasLiveOfferingForScope(
        teacherId,
        subjectId,
        systemId,
        stageId,
        gradeLevelId
      );
      if (!teacherMatchesScope) return notFound(res, "Teacher not found for this subject.");
    }

    const [tRows] = await pool.query(
      `
      SELECT
        t.id,
        COALESCE(NULLIF(t.name, ''), NULLIF(u.full_name, ''), CONCAT('Teacher #', t.id)) AS name,
        t.photo_url,
        t.bio_short
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id
      WHERE t.id = ?
        AND t.is_active = 1
        AND t.status = 'approved'
        AND u.is_active = 1
        AND u.role = 'teacher'
      LIMIT 1
      `,
      [teacherId]
    );

    if (!tRows || !tRows.length) return notFound(res, "Teacher not found, inactive, or not approved.");

    const tr = tRows[0];

    const [vRows] = await pool.query(
      hasSubjectId
        ? `
          SELECT video_url, is_primary, subject_id
          FROM teacher_videos
          WHERE teacher_id = ?
            AND (subject_id IS NULL OR subject_id = ?)
          ORDER BY
            CASE WHEN subject_id = ? THEN 0 ELSE 1 END,
            is_primary DESC
        `
        : `
          SELECT video_url, is_primary, subject_id
          FROM teacher_videos
          WHERE teacher_id = ?
          ORDER BY is_primary DESC
        `,
      hasSubjectId ? [teacherId, subjectId, subjectId] : [teacherId]
    );

    const clips = (vRows || [])
      .map((row, idx) => {
        const url = typeof row.video_url === "string" ? row.video_url.trim() : "";
        if (!url) return null;
        const title = row.is_primary ? "Primary clip" : `Clip ${idx + 1}`;
        return { title, url };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data: {
        id: String(tr.id),
        name: tr.name,
        photoUrl: tr.photo_url || null,
        bio: tr.bio_short || null,
        videoClips: clips,
      },
    });
  } catch (err) {
    return handleApiError(res, err, "getTeacherDetailsForStudent");
  }
};

/* =============================================================================
 * Availability & Booking
 * ============================================================================= */

/**
 * GET /student/teacher-availability
 * ✅ FIXED: Now uses getStudentContext instead of findStudentByUserId
 */
export async function studentGetTeacherAvailability(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    // ✅ FIXED: Use getStudentContext to enforce active student role
    const context = await getStudentContext(userId);
    if (!context) return notFound(res, "Active student profile not found.");

    const student = context.student;
    const availabilityRequest = buildStudentTeacherAvailabilityRequestContext(
      req.query,
      student
    );
    const {
      teacherId,
      subjectId,
      from,
      to,
    } = availabilityRequest;

    const availabilityContext = await loadStudentSubjectTeacherBookingContext(
      student,
      {
        subjectId,
        teacherId,
        executor: pool,
        selectionRequiredMessage:
          "You must have this teacher selected for the subject before viewing availability.",
        scopeErrorMessage: STUDENT_AVAILABILITY_SCOPE_INCOMPLETE_ERROR,
      }
    );
    if (!availabilityContext.ok) {
      return res.status(availabilityContext.status).json({
        success: false,
        message: availabilityContext.message,
      });
    }

    const {
      teacherId: normalizedTeacherId,
      subjectId: normalizedSubjectId,
      systemId,
      stageId,
      gradeLevelId,
    } = availabilityContext.context;

    if (from && !isValidDateStr(from)) return badRequest(res, "from must be YYYY-MM-DD");
    if (to && !isValidDateStr(to)) return badRequest(res, "to must be YYYY-MM-DD");
    if (!from || !to) {
      return badRequest(res, "from and to are required for availability queries.");
    }
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      return badRequest(res, "Invalid date range.");
    }
    const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
    if (rangeDays > 31) {
      return badRequest(res, "Maximum availability range is 31 days.");
    }

    // DEBUG helpers (only in non-production)
    if (!IS_PRODUCTION) {
      const sample = (arr, n = 5) => (Array.isArray(arr) ? arr.slice(0, n) : []);

      console.log("[DEBUG] studentGetTeacherAvailability params:", {
        teacherId: normalizedTeacherId,
        subjectId: normalizedSubjectId,
        systemId,
        stageId,
        gradeLevelId,
        from,
        to,
      });
    }

    const slotScopeMatch = buildAcademicScopeMatchSql(
      { systemId, stageId, gradeLevelId },
      {
        systemColumn: "tss.system_id",
        stageColumn: "tss.stage_id",
        gradeLevelColumn: "tss.grade_level_id",
      }
    );

    // 2) Scope-aware offerings
    const [slotScopes] = await pool.query(
      `
      SELECT
        tss.id,
        tss.schedule_id,

        tss.subject_id,
        s.name_en AS subject_name_en,
        s.name_ar AS subject_name_ar,

        tss.system_id,
        es.name   AS system_name,

        tss.stage_id,
        gs.name_en AS stage_name_en,
        gs.name_ar AS stage_name_ar,

        tss.grade_level_id,
        gl.name_en AS grade_level_name_en,
        gl.name_ar AS grade_level_name_ar,

        tss.is_active
      FROM teacher_schedule_subjects tss
      JOIN teacher_schedules ts ON ts.id = tss.schedule_id
      JOIN subjects s ON s.id = tss.subject_id
      JOIN educational_systems es ON es.id = tss.system_id
      JOIN grade_stages gs ON gs.id = tss.stage_id
      LEFT JOIN grade_levels gl ON gl.id = tss.grade_level_id
      WHERE ts.teacher_id = ?
        AND ts.is_active = 1
        AND tss.subject_id = ?
        AND tss.is_active = 1
        AND ${slotScopeMatch.sql}
      ORDER BY tss.schedule_id, tss.subject_id
      `,
      [normalizedTeacherId, normalizedSubjectId, ...slotScopeMatch.params]
    );

    const visibleSlotScopes = (slotScopes || []).filter((row) =>
      academicScopeMatchesRow(
        { systemId, stageId, gradeLevelId },
        row,
        {
          systemKey: "system_id",
          stageKey: "stage_id",
          gradeLevelKey: "grade_level_id",
        }
      )
    );

    const visibleScheduleIds = [...new Set(
      visibleSlotScopes
        .map((row) => parsePositiveInt(row.schedule_id))
        .filter(Boolean)
    )];

    let slots = [];
    if (visibleScheduleIds.length) {
      const [slotRows] = await pool.query(
        `
        SELECT
          id,
          id AS schedule_id,
          weekday,
          start_time,
          end_time,
          is_group,
          max_students,
          is_active
        FROM teacher_schedules
        WHERE teacher_id = ?
          AND is_active = 1
          AND id IN (?)
        ORDER BY weekday, start_time
        `,
        [normalizedTeacherId, visibleScheduleIds]
      );
      slots = slotRows;
    }

    // 3) Exceptions (optional date range)
    const exParams = [normalizedTeacherId];
    let exWhere = `WHERE teacher_id = ? AND is_active = 1`;
    if (from) {
      exWhere += ` AND exception_date >= ?`;
      exParams.push(from);
    }
    if (to) {
      exWhere += ` AND exception_date <= ?`;
      exParams.push(to);
    }

    const [exceptions] = await pool.query(
      `
      SELECT id, exception_date, start_time, end_time, exception_type,
             is_group, max_students, note, reason
      FROM teacher_schedule_exceptions
      ${exWhere}
      ORDER BY exception_date, start_time
      `,
      exParams
    );

    // 4) Sessions to block occupied times (optional date range)
    const sParams = [normalizedTeacherId];
    let sWhere = `WHERE teacher_id = ? AND status NOT IN ('cancelled', 'rejected')`;
    if (from) {
      sWhere += ` AND DATE(starts_at) >= ?`;
      sParams.push(from);
    }
    if (to) {
      sWhere += ` AND DATE(starts_at) <= ?`;
      sParams.push(to);
    }

    const [sessions] = await pool.query(
      `
      SELECT id, starts_at, ends_at, schedule_id, exception_id, status
      FROM lesson_sessions
      ${sWhere}
      ORDER BY starts_at
      `,
      sParams
    );

    // DEBUG info (only in non-production)
    if (!IS_PRODUCTION) {
      const sample = (arr, n = 5) => (Array.isArray(arr) ? arr.slice(0, n) : []);
      
      console.log("[DEBUG] availability Q1 slots", {
        count: slots?.length ?? 0,
        slotIds: sample(slots).map((x) => x.id),
      });

      console.log("[DEBUG] availability Q2 slotScopes", {
        count: slotScopes?.length ?? 0,
        scheduleIds: sample(slotScopes).map((x) => x.schedule_id),
      });

      console.log("[DEBUG] availability Q3 exceptions", {
        count: exceptions?.length ?? 0,
      });

      console.log("[DEBUG] availability Q4 sessions", {
        count: sessions?.length ?? 0,
      });
    }

    return res.json({
      success: true,
      data: {
        teacherId: normalizedTeacherId,
        subjectId: normalizedSubjectId,
        scope: { systemId, stageId, gradeLevelId },
        slots,
        slotScopes: visibleSlotScopes,
        exceptions,
        sessions,
      },
    });
  } catch (err) {
    return handleApiError(res, err, "studentGetTeacherAvailability");
  }
}

export const requestLessonSession = requestLessonSessionHandler;
export const getMyPendingLessonRequests = getMyPendingLessonRequestsHandler;
export const cancelMyLessonRequest = cancelMyLessonRequestHandler;
export const cancelMyScheduledSession = cancelMyScheduledSessionHandler;
