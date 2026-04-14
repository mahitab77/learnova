-- Migration 006: Enforce parent/linkage + teacher-selection invariants.
-- Safe to run multiple times.
--
-- Why:
-- 1) parent_students is treated as a linkage table in code; duplicate
--    (parent_id, student_id) rows create ambiguous ownership/linkage checks.
-- 2) student_teacher_selections upsert flow assumes a unique key on
--    (student_id, subject_id). Without it, ON DUPLICATE KEY UPDATE cannot
--    guarantee one authoritative selection per student+subject.
-- 3) These tables are part of workflow-critical authorization and selection paths,
--    so DB-level constraints are required (not app-only assumptions).

SET @db_name := DATABASE();

-- ---------------------------------------------------------------------------
-- A) parent_students: collapse duplicates, then enforce uniqueness + FKs.
-- ---------------------------------------------------------------------------

-- Preserve strongest has_own_login flag on keeper row (MIN id).
UPDATE parent_students ps
JOIN (
  SELECT
    parent_id,
    student_id,
    MIN(id) AS keeper_id,
    MAX(COALESCE(has_own_login, 0)) AS merged_has_own_login
  FROM parent_students
  GROUP BY parent_id, student_id
  HAVING COUNT(*) > 1
) d
  ON d.keeper_id = ps.id
SET ps.has_own_login = d.merged_has_own_login;

-- Remove duplicate linkage rows, keep the canonical keeper row.
DELETE ps_dup
FROM parent_students ps_dup
JOIN (
  SELECT
    parent_id,
    student_id,
    MIN(id) AS keeper_id
  FROM parent_students
  GROUP BY parent_id, student_id
  HAVING COUNT(*) > 1
) d
  ON d.parent_id = ps_dup.parent_id
 AND d.student_id = ps_dup.student_id
WHERE ps_dup.id <> d.keeper_id;

-- Add explicit unique linkage invariant.
SET @has_uq_parent_students_link := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'parent_students'
    AND INDEX_NAME = 'uq_parent_students_parent_student'
);

SET @add_uq_parent_students_link_sql := IF(
  @has_uq_parent_students_link = 0,
  'ALTER TABLE parent_students
     ADD UNIQUE KEY uq_parent_students_parent_student (parent_id, student_id)',
  'SELECT 1'
);
PREPARE stmt FROM @add_uq_parent_students_link_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure expected foreign keys are explicitly present (matches schema posture).
SET @has_fk_parent_students_parent := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db_name
    AND TABLE_NAME = 'parent_students'
    AND CONSTRAINT_NAME = 'fk_parent_students_parent'
);

SET @add_fk_parent_students_parent_sql := IF(
  @has_fk_parent_students_parent = 0,
  'ALTER TABLE parent_students
     ADD CONSTRAINT fk_parent_students_parent
       FOREIGN KEY (parent_id) REFERENCES parents(id)
       ON UPDATE RESTRICT ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk_parent_students_parent_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk_parent_students_student := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db_name
    AND TABLE_NAME = 'parent_students'
    AND CONSTRAINT_NAME = 'fk_parent_students_student'
);

SET @add_fk_parent_students_student_sql := IF(
  @has_fk_parent_students_student = 0,
  'ALTER TABLE parent_students
     ADD CONSTRAINT fk_parent_students_student
       FOREIGN KEY (student_id) REFERENCES students(id)
       ON UPDATE RESTRICT ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk_parent_students_student_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- B) student_teacher_selections: collapse duplicates, then enforce uniqueness.
-- ---------------------------------------------------------------------------

-- Keep newest selection per (student_id, subject_id): selected_at desc, id desc.
DELETE sts_old
FROM student_teacher_selections sts_old
JOIN student_teacher_selections sts_new
  ON sts_old.student_id = sts_new.student_id
 AND sts_old.subject_id = sts_new.subject_id
 AND (
      COALESCE(sts_old.selected_at, '1970-01-01 00:00:00')
        < COALESCE(sts_new.selected_at, '1970-01-01 00:00:00')
      OR (
        COALESCE(sts_old.selected_at, '1970-01-01 00:00:00')
          = COALESCE(sts_new.selected_at, '1970-01-01 00:00:00')
        AND sts_old.id < sts_new.id
      )
    );

SET @has_uq_student_teacher_selection := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'student_teacher_selections'
    AND INDEX_NAME = 'uq_student_teacher_selection'
);

SET @add_uq_student_teacher_selection_sql := IF(
  @has_uq_student_teacher_selection = 0,
  'ALTER TABLE student_teacher_selections
     ADD UNIQUE KEY uq_student_teacher_selection (student_id, subject_id)',
  'SELECT 1'
);
PREPARE stmt FROM @add_uq_student_teacher_selection_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure expected FK coverage used by workflow assumptions.
SET @has_fk_sts_student := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db_name
    AND TABLE_NAME = 'student_teacher_selections'
    AND CONSTRAINT_NAME = 'fk_sts_student'
);

SET @add_fk_sts_student_sql := IF(
  @has_fk_sts_student = 0,
  'ALTER TABLE student_teacher_selections
     ADD CONSTRAINT fk_sts_student
       FOREIGN KEY (student_id) REFERENCES students(id)
       ON UPDATE RESTRICT ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk_sts_student_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk_sts_subject := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db_name
    AND TABLE_NAME = 'student_teacher_selections'
    AND CONSTRAINT_NAME = 'fk_sts_subject'
);

SET @add_fk_sts_subject_sql := IF(
  @has_fk_sts_subject = 0,
  'ALTER TABLE student_teacher_selections
     ADD CONSTRAINT fk_sts_subject
       FOREIGN KEY (subject_id) REFERENCES subjects(id)
       ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk_sts_subject_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk_sts_teacher := (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = @db_name
    AND TABLE_NAME = 'student_teacher_selections'
    AND CONSTRAINT_NAME = 'fk_sts_teacher'
);

SET @add_fk_sts_teacher_sql := IF(
  @has_fk_sts_teacher = 0,
  'ALTER TABLE student_teacher_selections
     ADD CONSTRAINT fk_sts_teacher
       FOREIGN KEY (teacher_id) REFERENCES teachers(id)
       ON UPDATE RESTRICT ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_fk_sts_teacher_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
