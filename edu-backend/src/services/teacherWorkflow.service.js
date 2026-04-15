const ALLOWED_TABLES = new Set([
  "subjects",
  "educational_systems",
  "grade_stages",
  "grade_levels",
  "users",
  "teachers",
  "students",
  "teacher_schedules",
  "teacher_schedule_exceptions",
  "lesson_sessions",
  "lesson_session_students",
  "homework_assignments",
  "homework_submissions",
  "quiz_assignments",
  "quiz_submissions",
  "teacher_subjects",
  "teacher_grade_levels",
  "teacher_videos",
  "teacher_schedule_subjects",
  "student_teacher_selections",
]);

function getSessionAuthUserId(sessionUser) {
  const id = sessionUser?.id;
  return Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : null;
}

export async function resolveTeacherContext(conn, sessionUser) {
  const userId = getSessionAuthUserId(sessionUser);
  if (!userId) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  if (sessionUser?.role !== "teacher") {
    return { ok: false, status: 403, message: "Forbidden - session role mismatch" };
  }

  const [uRows] = await conn.query(
    `SELECT id, role, is_active, full_name
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  const user = uRows?.[0];
  if (!user) return { ok: false, status: 401, message: "User not found" };
  if (Number(user.is_active) !== 1) {
    return { ok: false, status: 403, message: "User is inactive" };
  }
  if (user.role !== "teacher") {
    return { ok: false, status: 403, message: "User is not a teacher" };
  }

  const [tRows] = await conn.query(
    `SELECT id, user_id, status, is_active
     FROM teachers
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  const teacher = tRows?.[0];
  if (!teacher) {
    return { ok: false, status: 403, message: "Teacher profile not found" };
  }
  if (Number(teacher.is_active) !== 1) {
    return { ok: false, status: 403, message: "Teacher profile is inactive" };
  }
  if (teacher.status === "rejected") {
    return { ok: false, status: 403, message: "Teacher profile is rejected" };
  }

  return { ok: true, userId, teacherId: teacher.id, teacherStatus: teacher.status };
}

export async function insertNotificationSafely(
  conn,
  { userId, title, body, relatedType, relatedId, extraData }
) {
  const safeRelatedType = typeof relatedType === "string" ? relatedType : "other";
  const safeExtra = extraData != null ? JSON.stringify(extraData) : JSON.stringify({});

  try {
    await conn.query(
      `
      INSERT INTO notifications
        (user_id, type, title, body, related_type, related_id, is_read, created_at, extra_data)
      VALUES
        (?, 'system', ?, ?, ?, ?, 0, NOW(), ?)
      `,
      [userId, title, body, safeRelatedType, relatedId, safeExtra]
    );
    return;
  } catch (err) {
    if (err && (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054)) {
      await conn.query(
        `
        INSERT INTO notifications
          (user_id, type, title, body, related_type, related_id, is_read, created_at)
        VALUES
          (?, 'system', ?, ?, ?, ?, 0, NOW())
        `,
        [userId, title, body, safeRelatedType, relatedId]
      );
      return;
    }
    throw err;
  }
}

export async function checkScheduleOverlap(
  conn,
  teacherId,
  weekday1to7,
  startTime,
  endTime,
  excludeScheduleId = null
) {
  const params = [teacherId, weekday1to7, endTime, startTime];

  let sql = `
    SELECT id
    FROM teacher_schedules
    WHERE teacher_id = ?
      AND weekday = ?
      AND is_active = 1
      AND start_time < ?
      AND end_time > ?
  `;

  if (excludeScheduleId != null) {
    sql += ` AND id <> ?`;
    params.push(excludeScheduleId);
  }

  sql += ` LIMIT 1`;

  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}

async function entityExists(conn, table, id) {
  if (!ALLOWED_TABLES.has(table)) {
    console.warn(
      `[teacherWorkflow.service] Blocked entityExists query for non-whitelisted table: ${table}`
    );
    return false;
  }
  const [rows] = await conn.query(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0;
}

async function stageBelongsToSystem(conn, stageId, systemId) {
  const [rows] = await conn.query(
    `SELECT id FROM grade_stages WHERE id = ? AND system_id = ? LIMIT 1`,
    [stageId, systemId]
  );
  return rows.length > 0;
}

async function gradeLevelBelongsToStage(conn, gradeLevelId, stageId) {
  const [rows] = await conn.query(
    `SELECT id FROM grade_levels WHERE id = ? AND stage_id = ? LIMIT 1`,
    [gradeLevelId, stageId]
  );
  return rows.length > 0;
}

export async function validateOfferingForeignKeys(conn, row) {
  const { subject_id, system_id, stage_id, grade_level_id } = row;

  if (!(await entityExists(conn, "subjects", subject_id))) {
    return { ok: false, message: `Invalid subject_id (${subject_id})` };
  }
  if (!(await entityExists(conn, "educational_systems", system_id))) {
    return { ok: false, message: `Invalid system_id (${system_id})` };
  }
  if (!(await entityExists(conn, "grade_stages", stage_id))) {
    return { ok: false, message: `Invalid stage_id (${stage_id})` };
  }
  if (!(await stageBelongsToSystem(conn, stage_id, system_id))) {
    return {
      ok: false,
      message: `stage_id (${stage_id}) does not belong to system_id (${system_id})`,
    };
  }

  if (grade_level_id != null) {
    if (!(await entityExists(conn, "grade_levels", grade_level_id))) {
      return { ok: false, message: `Invalid grade_level_id (${grade_level_id})` };
    }
    if (!(await gradeLevelBelongsToStage(conn, grade_level_id, stage_id))) {
      return {
        ok: false,
        message: `grade_level_id (${grade_level_id}) does not belong to stage_id (${stage_id})`,
      };
    }
  }

  return { ok: true };
}
