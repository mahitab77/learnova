import pool from "../db.js";
import { buildAcademicScopeMatchSql } from "../utils/academicScope.js";

export async function loadStudentSubjects(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      sts.subject_id,
      s.name_en       AS subject_name_en,
      s.name_ar       AS subject_name_ar,
      s.sort_order    AS subject_sort_order,
      sts.teacher_id,
      t.name          AS teacher_name,
      t.photo_url     AS teacher_photo_url,
      sts.status      AS selection_status,
      sts.selected_by,
      sts.selected_at,
      tv.video_url    AS primary_video_url
    FROM student_teacher_selections sts
    INNER JOIN subjects s ON s.id = sts.subject_id
    INNER JOIN teachers t ON t.id = sts.teacher_id
    LEFT JOIN teacher_videos tv
      ON tv.teacher_id = sts.teacher_id
      AND (tv.subject_id IS NULL OR tv.subject_id = sts.subject_id)
      AND tv.is_primary = 1
    WHERE sts.student_id = ?
      AND sts.status = 'active'
    ORDER BY s.sort_order, s.id
    `,
    [studentId]
  );

  return rows.map((row) => ({
    subjectId: row.subject_id,
    nameEn: row.subject_name_en,
    nameAr: row.subject_name_ar,
    teacher: row.teacher_id
      ? {
          id: row.teacher_id,
          name: row.teacher_name,
          photoUrl: row.teacher_photo_url || null,
          primaryVideoUrl: row.primary_video_url || null,
        }
      : null,
    selectionStatus: row.selection_status,
    selectedBy: row.selected_by,
    selectedAt: row.selected_at,
  }));
}

export async function loadSubjectsForStudent(studentId) {
  const [rows] = await pool.query(
    `
    SELECT
      ss.subject_id                                  AS subjectId,
      s.name_en                                      AS nameEn,
      s.name_ar                                      AS nameAr,
      s.sort_order                                   AS sortOrder,
      latest_sts.teacher_id                          AS teacherId,
      t.name                                         AS teacherName,
      t.photo_url                                    AS teacherPhotoUrl,
      tv.video_url                                   AS teacherPrimaryVideoUrl,
      COALESCE(latest_sts.status, 'no_selection')    AS selectionStatus,
      COALESCE(latest_sts.selected_by, 'student')    AS selectedBy,
      latest_sts.selected_at                         AS selectedAt
    FROM student_subjects ss
    INNER JOIN subjects s ON s.id = ss.subject_id
    LEFT JOIN (
      SELECT
        student_id,
        subject_id,
        teacher_id,
        status,
        selected_by,
        selected_at
      FROM student_teacher_selections
      WHERE student_id = ?
        AND status IN ('active','pending_change','replaced')
        AND (subject_id, selected_at) IN (
          SELECT subject_id, MAX(selected_at)
          FROM student_teacher_selections
          WHERE student_id = ?
            AND status IN ('active','pending_change','replaced')
          GROUP BY subject_id
        )
    ) latest_sts ON latest_sts.student_id = ss.student_id
                 AND latest_sts.subject_id = ss.subject_id
    LEFT JOIN teachers t ON t.id = latest_sts.teacher_id
    LEFT JOIN teacher_videos tv
      ON tv.teacher_id = t.id
     AND (tv.subject_id IS NULL OR tv.subject_id = s.id)
     AND tv.is_primary = 1
    WHERE ss.student_id = ?
    ORDER BY s.sort_order, s.id
    `,
    [studentId, studentId, studentId]
  );

  return rows.map((row) => ({
    subjectId: row.subjectId,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    sortOrder: row.sortOrder,
    teacher: row.teacherId
      ? {
          id: row.teacherId,
          name: row.teacherName || "",
          photoUrl: row.teacherPhotoUrl || null,
          primaryVideoUrl: row.teacherPrimaryVideoUrl || null,
        }
      : null,
    selectionStatus: row.selectionStatus || "no_selection",
    selectedBy: row.selectedBy || "student",
    selectedAt: row.selectedAt || null,
  }));
}

export async function loadAvailableSubjectsForStudent(
  studentId,
  systemId,
  stageId,
  gradeLevelId
) {
  const scopeMatch = buildAcademicScopeMatchSql(
    { systemId, stageId, gradeLevelId },
    {
      systemColumn: "sa.system_id",
      stageColumn: "sa.stage_id",
      gradeLevelColumn: "sa.grade_level_id",
    }
  );

  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      sa.subject_id                         AS subject_id,
      s.name_en                             AS subject_name_en,
      s.name_ar                             AS subject_name_ar,
      s.sort_order                          AS subject_sort_order
    FROM subject_availability sa
    INNER JOIN subjects s
      ON s.id = sa.subject_id
    LEFT JOIN student_subjects ss
      ON ss.subject_id = sa.subject_id
     AND ss.student_id = ?
    WHERE sa.is_active = 1
      AND s.is_active  = 1
      AND ss.id IS NULL
      AND ${scopeMatch.sql}
    ORDER BY s.sort_order, s.id
    `,
    [studentId, ...scopeMatch.params]
  );

  return rows.map((row) => ({
    subjectId: row.subject_id,
    nameEn: row.subject_name_en,
    nameAr: row.subject_name_ar,
  }));
}
