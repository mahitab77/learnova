// src/controllers/moderator.controller.js
// ============================================================================
// MODERATOR CONTROLLER
// ----------------------------------------------------------------------------
// Read-only access to sessions, students, teachers, homework, quizzes.
// Write access limited to: marking attendance as "excused" only.
// ============================================================================

import pool from "../db.js";

// ============================================================================
// HELPERS
// ============================================================================

function serverError(res, msg = "Server error.") {
  return res.status(500).json({ success: false, message: msg });
}

function badRequest(res, msg) {
  return res.status(400).json({ success: false, message: msg });
}

function notFound(res, msg = "Not found.") {
  return res.status(404).json({ success: false, message: msg });
}

// ============================================================================
// LESSON SESSIONS (read-only)
// ============================================================================

/**
 * GET /moderator/lesson-sessions
 * Full session list with teacher, subject, student count, and per-student attendance.
 */
export const getModeratorLessonSessions = async (req, res) => {
  try {
    const [sessions] = await pool.query(
      `
      SELECT
        ls.id,
        ls.starts_at,
        ls.ends_at,
        ls.status,
        ls.is_group,
        ls.max_students,
        ls.created_at,

        ls.teacher_id,
        t.name AS teacher_name,

        ls.subject_id,
        s.name_en AS subject_name_en,
        s.name_ar AS subject_name_ar,

        ls.created_by_user_id,
        u.full_name AS created_by_name,

        (SELECT COUNT(*) FROM lesson_session_students lss WHERE lss.session_id = ls.id) AS students_count
      FROM lesson_sessions ls
      JOIN teachers t ON t.id = ls.teacher_id
      JOIN subjects s ON s.id = ls.subject_id
      LEFT JOIN users u ON u.id = ls.created_by_user_id
      ORDER BY ls.starts_at DESC
      LIMIT 500
      `
    );

    return res.json({ success: true, data: sessions });
  } catch (err) {
    console.error("getModeratorLessonSessions error:", err);
    return serverError(res);
  }
};

/**
 * GET /moderator/lesson-sessions/:sessionId/students
 * Students enrolled in a specific session with their attendance status.
 */
export const getModeratorSessionStudents = async (req, res) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  if (!sessionId || sessionId <= 0) return badRequest(res, "Invalid sessionId");

  try {
    const [rows] = await pool.query(
      `
      SELECT
        lss.student_id,
        u.full_name AS student_name,
        u.email,
        lss.attendance_status
      FROM lesson_session_students lss
      JOIN students st ON st.id = lss.student_id
      JOIN users u ON u.id = st.user_id
      WHERE lss.session_id = ?
      ORDER BY u.full_name
      `,
      [sessionId]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getModeratorSessionStudents error:", err);
    return serverError(res);
  }
};

// ============================================================================
// ATTENDANCE — EXCUSED ONLY
// ============================================================================

/**
 * PATCH /moderator/lesson-sessions/:sessionId/attendance
 * Moderators may only set attendance_status = "excused".
 * The status value is HARDCODED — never read from the request body.
 */
export const markAttendanceExcused = async (req, res) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  const studentId = parseInt(req.body?.student_id, 10);

  if (!sessionId || sessionId <= 0) return badRequest(res, "Invalid sessionId");
  if (!studentId || studentId <= 0) return badRequest(res, "student_id is required");

  try {
    // Confirm the session exists
    const [session] = await pool.query(
      "SELECT id FROM lesson_sessions WHERE id = ? LIMIT 1",
      [sessionId]
    );
    if (!session.length) return notFound(res, "Session not found");

    // Update — status is HARDCODED to "excused", never from request body
    const [upd] = await pool.query(
      `UPDATE lesson_session_students
       SET attendance_status = 'excused'
       WHERE session_id = ? AND student_id = ?`,
      [sessionId, studentId]
    );

    if (!upd.affectedRows) return notFound(res, "Student not found in this session");

    return res.json({ success: true, message: "Attendance marked as excused." });
  } catch (err) {
    console.error("markAttendanceExcused error:", err);
    return serverError(res);
  }
};

// ============================================================================
// STUDENTS (read-only)
// ============================================================================

/**
 * GET /moderator/students
 */
export const getModeratorStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        s.id AS student_id,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.preferred_lang,
        u.is_active,
        u.created_at
      FROM students s
      INNER JOIN users u ON u.id = s.user_id
      ORDER BY u.full_name, s.id
      `
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getModeratorStudents error:", err);
    return serverError(res);
  }
};

// ============================================================================
// TEACHERS (read-only)
// ============================================================================

/**
 * GET /moderator/teachers
 */
export const getModeratorTeachers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        t.bio_short,
        t.gender,
        t.photo_url,
        t.is_active,
        t.created_at,
        GROUP_CONCAT(DISTINCT s.name_en SEPARATOR ', ') AS subjects
      FROM teachers t
      LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
      LEFT JOIN subjects s ON s.id = ts.subject_id
      GROUP BY t.id
      ORDER BY t.name
      `
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getModeratorTeachers error:", err);
    return serverError(res);
  }
};

// ============================================================================
// HOMEWORK (read-only)
// ============================================================================

/**
 * GET /moderator/homework
 */
export const getModeratorHomework = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        ha.id,
        ha.title,
        ha.description,
        ha.due_at,
        ha.max_score,
        ha.is_active,
        ha.created_at,
        t.name AS teacher_name,
        s.name_en AS subject_name_en,
        s.name_ar AS subject_name_ar
      FROM homework_assignments ha
      JOIN teachers t ON t.id = ha.teacher_id
      JOIN subjects s ON s.id = ha.subject_id
      ORDER BY ha.created_at DESC, ha.id DESC
      LIMIT 500
      `
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getModeratorHomework error:", err);
    return serverError(res);
  }
};

// ============================================================================
// QUIZZES (read-only)
// ============================================================================

/**
 * GET /moderator/quizzes
 */
export const getModeratorQuizzes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        qa.id,
        qa.title,
        qa.description,
        qa.available_from,
        qa.available_until,
        qa.time_limit_min,
        qa.max_score,
        qa.is_active,
        qa.created_at,
        t.name AS teacher_name,
        s.name_en AS subject_name_en,
        s.name_ar AS subject_name_ar
      FROM quiz_assignments qa
      JOIN teachers t ON t.id = qa.teacher_id
      JOIN subjects s ON s.id = qa.subject_id
      ORDER BY qa.created_at DESC, qa.id DESC
      LIMIT 500
      `
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getModeratorQuizzes error:", err);
    return serverError(res);
  }
};
