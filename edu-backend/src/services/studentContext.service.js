import pool from "../db.js";
import { resolveStudentAcademicIds } from "../utils/academicScope.js";

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
}

export async function findStudentByUserId(userId, executor = pool) {
  const [rows] = await executor.query(
    `
    SELECT
      id,
      user_id,
      system_id,
      stage_id,
      grade_level_id,
      gender,
      onboarding_completed
    FROM students
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );
  return rows.length ? rows[0] : null;
}

export async function getStudentContext(userId, executor = pool) {
  const [userRows] = await executor.query(
    `
    SELECT id, full_name, preferred_lang, role, is_active
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (!userRows.length) return null;

  const user = userRows[0];
  if (user.role !== "student" || Number(user.is_active) !== 1) return null;

  const student = await findStudentByUserId(userId, executor);
  if (!student) return null;

  return { user, student };
}

export async function loadStudentSubjectTeacherBookingContext(
  student,
  {
    subjectId,
    teacherId,
    executor = pool,
    selectionRequiredMessage,
    scopeErrorMessage,
  } = {}
) {
  const normalizedSubjectId = toPositiveInt(subjectId);
  if (!normalizedSubjectId) {
    return {
      ok: false,
      status: 400,
      message: "subject_id (or subjectId) is required and must be a valid integer.",
    };
  }

  const normalizedTeacherId = toPositiveInt(teacherId);
  if (!normalizedTeacherId) {
    return {
      ok: false,
      status: 400,
      message: "teacher_id (or teacherId) is required and must be a valid integer.",
    };
  }

  const [enrollmentRows] = await executor.query(
    `
    SELECT 1
    FROM student_subjects
    WHERE student_id = ?
      AND subject_id = ?
    LIMIT 1
    `,
    [student.id, normalizedSubjectId]
  );

  if (!enrollmentRows.length) {
    return {
      ok: false,
      status: 400,
      message: "Student is not enrolled in this subject.",
    };
  }

  const [[activeSelection]] = await executor.query(
    `
    SELECT id, selected_at
    FROM student_teacher_selections
    WHERE student_id = ?
      AND subject_id = ?
      AND teacher_id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [student.id, normalizedSubjectId, normalizedTeacherId]
  );

  if (!activeSelection) {
    return {
      ok: false,
      status: 400,
      message:
        selectionRequiredMessage ||
        "You must have this teacher selected for the subject before continuing.",
    };
  }

  const { systemId, stageId, gradeLevelId } = await resolveStudentAcademicIds(
    student,
    executor
  );

  if (!systemId || !stageId) {
    return {
      ok: false,
      status: 400,
      message:
        scopeErrorMessage ||
        "Student academic scope could not be resolved. Ensure students.system_id and students.stage_id are populated.",
    };
  }

  return {
    ok: true,
    context: {
      studentId: student.id,
      teacherId: normalizedTeacherId,
      subjectId: normalizedSubjectId,
      systemId,
      stageId,
      gradeLevelId,
      selectionId: toPositiveInt(activeSelection.id),
      selectedAt: activeSelection.selected_at ?? null,
    },
  };
}
