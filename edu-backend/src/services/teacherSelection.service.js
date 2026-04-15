import pool from "../db.js";

const ALLOWED_SELECTION_ACTORS = new Set(["student", "parent", "admin"]);

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
}

function normalizeSelectionWriteInput({
  studentId,
  subjectId,
  teacherId,
  selectedBy,
} = {}) {
  const normalized = {
    studentId: toPositiveInt(studentId),
    subjectId: toPositiveInt(subjectId),
    teacherId: toPositiveInt(teacherId),
    selectedBy:
      typeof selectedBy === "string" ? selectedBy.trim().toLowerCase() : null,
  };

  if (!normalized.studentId || !normalized.subjectId || !normalized.teacherId) {
    throw new Error(
      "studentId, subjectId, and teacherId are required positive integers."
    );
  }

  if (!ALLOWED_SELECTION_ACTORS.has(normalized.selectedBy)) {
    throw new Error("selectedBy must be one of: student, parent, admin.");
  }

  return normalized;
}

/**
 * Backend is the only owner of selection-write invariants.
 * Assumes DB unique key `uq_student_teacher_selection` on
 * student_teacher_selections(student_id, subject_id). This makes
 * ON DUPLICATE KEY UPDATE safe and keeps one authoritative active selection
 * per student+subject.
 */
export async function upsertTeacherSelection(
  executor = pool,
  input = {}
) {
  const db = executor ?? pool;
  const { studentId, subjectId, teacherId, selectedBy } =
    normalizeSelectionWriteInput(input);

  await db.query(
    `
    INSERT INTO student_teacher_selections
      (student_id, subject_id, teacher_id, selected_by, status, selected_at)
    VALUES
      (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      teacher_id = VALUES(teacher_id),
      selected_by = VALUES(selected_by),
      status = 'active',
      selected_at = CURRENT_TIMESTAMP
    `,
    [studentId, subjectId, teacherId, selectedBy]
  );

  const [rows] = await db.query(
    `
    SELECT
      id,
      student_id,
      subject_id,
      teacher_id,
      selected_by,
      status,
      selected_at
    FROM student_teacher_selections
    WHERE student_id = ? AND subject_id = ?
    LIMIT 1
    `,
    [studentId, subjectId]
  );

  if (!rows.length) {
    throw new Error("Teacher selection upsert completed without a persisted row.");
  }

  return rows[0];
}

