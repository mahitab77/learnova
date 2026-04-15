import pool from "../../db.js";

export async function loadUpcomingLessons(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      lss.id                    AS link_id,
      ls.id                     AS session_id,
      ls.starts_at,
      ls.ends_at,
      ls.subject_id,
      subj.name_en              AS subject_name_en,
      subj.name_ar              AS subject_name_ar,
      t.id                      AS teacher_id,
      t.name                    AS teacher_name,
      t.photo_url               AS teacher_photo_url,
      lss.attendance_status
    FROM lesson_session_students lss
    INNER JOIN lesson_sessions ls ON ls.id = lss.session_id
    INNER JOIN subjects subj ON subj.id = ls.subject_id
    INNER JOIN teachers t ON t.id = ls.teacher_id
    WHERE lss.student_id = ?
      AND ls.status IN ('scheduled', 'approved')
      AND ls.starts_at >= NOW()
    ORDER BY ls.starts_at ASC
    LIMIT 10
    `,
    [studentId]
  );

  return rows.map((row) => ({
    sessionId: row.session_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    subjectId: row.subject_id,
    subjectNameEn: row.subject_name_en,
    subjectNameAr: row.subject_name_ar,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    teacherPhotoUrl: row.teacher_photo_url || null,
    attendanceStatus: row.attendance_status,
  }));
}

export async function loadAttendanceSummary(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      SUM(CASE WHEN lss.attendance_status = 'present' THEN 1 ELSE 0 END) AS present_count,
      SUM(
        CASE
          WHEN lss.attendance_status IN ('present','absent','late','excused')
          THEN 1 ELSE 0
        END
      ) AS total_sessions
    FROM lesson_session_students lss
    INNER JOIN lesson_sessions ls ON ls.id = lss.session_id
    WHERE lss.student_id = ?
      AND ls.starts_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `,
    [studentId]
  );

  const row = rows[0] || {};
  const presentCount = row.present_count || 0;
  const totalSessions = row.total_sessions || 0;
  const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
  return { period: "last_30_days", presentCount, totalSessions, percentage };
}

export async function loadPendingHomework(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      ha.id               AS homework_id,
      ha.title            AS homework_title,
      ha.subject_id,
      subj.name_en        AS subject_name_en,
      subj.name_ar        AS subject_name_ar,
      ha.due_at,
      ha.max_score,
      hs.status           AS submission_status,
      hs.score            AS submission_score
    FROM homework_assignments ha
    INNER JOIN student_subjects ss
      ON ss.subject_id = ha.subject_id
      AND ss.student_id = ?
    INNER JOIN subjects subj
      ON subj.id = ha.subject_id
    LEFT JOIN homework_submissions hs
      ON hs.homework_id = ha.id
      AND hs.student_id = ss.student_id
    WHERE ha.is_active = 1
      AND (
        hs.status IS NULL
        OR hs.status IN ('not_started','submitted','late')
      )
    ORDER BY ha.due_at ASC
    LIMIT 20
    `,
    [studentId]
  );

  return rows.map((row) => ({
    id: row.homework_id,
    title: row.homework_title,
    subjectId: row.subject_id,
    subjectNameEn: row.subject_name_en,
    subjectNameAr: row.subject_name_ar,
    dueAt: row.due_at,
    maxScore: row.max_score,
    status: row.submission_status || "not_started",
    score: row.submission_score,
  }));
}

export async function loadPendingQuizzes(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      qa.id               AS quiz_id,
      qa.title            AS quiz_title,
      qa.subject_id,
      subj.name_en        AS subject_name_en,
      subj.name_ar        AS subject_name_ar,
      qa.available_from,
      qa.available_until,
      qa.max_score,
      qs.status           AS submission_status,
      qs.score            AS submission_score
    FROM quiz_assignments qa
    INNER JOIN student_subjects ss
      ON ss.subject_id = qa.subject_id
      AND ss.student_id = ?
    INNER JOIN subjects subj
      ON subj.id = qa.subject_id
    LEFT JOIN quiz_submissions qs
      ON qs.quiz_id = qa.id
      AND qs.student_id = ss.student_id
    WHERE qa.is_active = 1
      AND (qa.available_from IS NULL OR qa.available_from <= NOW())
      AND (qa.available_until IS NULL OR qa.available_until >= NOW())
      AND (
        qs.status IS NULL
        OR qs.status IN ('not_started','in_progress','submitted','late')
      )
    ORDER BY qa.available_until ASC
    LIMIT 20
    `,
    [studentId]
  );

  return rows.map((row) => ({
    id: row.quiz_id,
    title: row.quiz_title,
    subjectId: row.subject_id,
    subjectNameEn: row.subject_name_en,
    subjectNameAr: row.subject_name_ar,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
    maxScore: row.max_score,
    status: row.submission_status || "not_started",
    score: row.submission_score,
  }));
}

export async function loadRecentHomeworkGrades(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      ha.id             AS homework_id,
      ha.title          AS homework_title,
      subj.name_en      AS subject_name_en,
      subj.name_ar      AS subject_name_ar,
      hs.score,
      ha.max_score,
      hs.submitted_at
    FROM homework_submissions hs
    INNER JOIN homework_assignments ha ON ha.id = hs.homework_id
    INNER JOIN subjects subj ON subj.id = ha.subject_id
    WHERE hs.student_id = ?
      AND hs.status = 'graded'
    ORDER BY hs.submitted_at DESC
    LIMIT 20
    `,
    [studentId]
  );

  return rows.map((row) => ({
    assignmentId: row.homework_id,
    title: row.homework_title,
    subjectNameEn: row.subject_name_en,
    subjectNameAr: row.subject_name_ar,
    score: row.score,
    maxScore: row.max_score,
    gradedAt: row.submitted_at,
  }));
}

export async function loadRecentQuizGrades(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      qs.quiz_id        AS quiz_id,
      qa.title          AS quiz_title,
      subj.name_en      AS subject_name_en,
      subj.name_ar      AS subject_name_ar,
      qs.score,
      qa.max_score,
      qs.submitted_at
    FROM quiz_submissions qs
    INNER JOIN quiz_assignments qa ON qa.id = qs.quiz_id
    INNER JOIN subjects subj ON subj.id = qa.subject_id
    WHERE qs.student_id = ?
      AND qs.status = 'graded'
    ORDER BY qs.submitted_at DESC
    LIMIT 20
    `,
    [studentId]
  );

  return rows.map((row) => ({
    quizId: row.quiz_id,
    title: row.quiz_title,
    subjectNameEn: row.subject_name_en,
    subjectNameAr: row.subject_name_ar,
    score: row.score,
    maxScore: row.max_score,
    gradedAt: row.submitted_at,
  }));
}

export async function loadAnnouncementsForStudent() {
  const [rows] = await pool.query(
    `
    SELECT id, title, body, audience, created_at
    FROM announcements
    WHERE audience IN ('all','students')
    ORDER BY created_at DESC
    LIMIT 10
    `
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    createdAt: row.created_at,
  }));
}

export async function loadNotifications(userId) {
  const [countRows] = await pool.query(
    `
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = ?
      AND is_read = 0
    `,
    [userId]
  );

  const unreadCount = countRows?.[0]?.unread_count || 0;

  const [items] = await pool.query(
    `
    SELECT
      id, type, title, body,
      related_type, related_id,
      is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
    `,
    [userId]
  );

  return {
    unreadCount,
    items: items.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      relatedType: row.related_type,
      relatedId: row.related_id,
      isRead: !!row.is_read,
      createdAt: row.created_at,
    })),
  };
}
