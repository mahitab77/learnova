import pool from "../db.js";

export async function loadParentLinkedStudents(parentId) {
  const [rows] = await pool.query(
    `
      SELECT
        ps.id AS link_id,
        s.id AS student_id,
        u.full_name AS student_name,
        s.system_id,
        s.stage_id,
        s.grade_level_id,
        es.name         AS system_name,
        gs.name_en      AS stage_name,
        gl.name_en      AS grade_level_name,
        ps.relationship,
        CASE WHEN ps.has_own_login = 1 THEN 1 ELSE 0 END AS has_own_login,
        s.user_id AS student_user_id
      FROM parent_students ps
      INNER JOIN students s ON s.id = ps.student_id
      INNER JOIN users u ON u.id = s.user_id
      LEFT JOIN educational_systems es ON es.id = s.system_id
      LEFT JOIN grade_stages gs ON gs.id = s.stage_id
      LEFT JOIN grade_levels gl ON gl.id = s.grade_level_id
      WHERE ps.parent_id = ?
      ORDER BY student_name
      `,
    [parentId]
  );
  return rows;
}

export async function isStudentLinkedToParent(parentId, studentId) {
  const [rows] = await pool.query(
    `
      SELECT id
      FROM parent_students
      WHERE parent_id = ? AND student_id = ?
      LIMIT 1
      `,
    [parentId, studentId]
  );
  return rows.length > 0;
}

export async function loadParentViewStudentSelections(studentId) {
  const [rows] = await pool.query(
    `
      SELECT
        COALESCE(sts.id, ss.id) AS id,
        ss.subject_id,
        subj.name_ar     AS subject_name_ar,
        subj.name_en     AS subject_name_en,
        sts.teacher_id   AS teacher_id,
        COALESCE(t.name, '') AS teacher_name,
        NULL AS photo_url
      FROM student_subjects ss
      INNER JOIN subjects subj ON subj.id = ss.subject_id
      LEFT JOIN student_teacher_selections sts
        ON sts.student_id = ss.student_id
       AND sts.subject_id = ss.subject_id
      LEFT JOIN teachers t ON t.id = sts.teacher_id
      WHERE ss.student_id = ?
      ORDER BY subj.name_en, subj.id
      `,
    [studentId]
  );
  return rows;
}
