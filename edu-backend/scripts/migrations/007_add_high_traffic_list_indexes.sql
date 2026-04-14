-- Migration 007: Add focused indexes for high-traffic admin/discovery lists.
-- Safe to run multiple times.

SET @db_name := DATABASE();

-- ---------------------------------------------------------------------------
-- parent_change_requests admin listing (ORDER BY created_at DESC)
-- ---------------------------------------------------------------------------
SET @has_idx_pcr_created := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'parent_change_requests'
    AND INDEX_NAME = 'idx_pcr_created_at'
);

SET @sql := IF(
  @has_idx_pcr_created = 0,
  'ALTER TABLE parent_change_requests
     ADD KEY idx_pcr_created_at (created_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- lesson_sessions admin pending queue + session list order/filter
-- ---------------------------------------------------------------------------
SET @has_idx_ls_status_created := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'lesson_sessions'
    AND INDEX_NAME = 'idx_lesson_sessions_status_created'
);

SET @sql := IF(
  @has_idx_ls_status_created = 0,
  'ALTER TABLE lesson_sessions
     ADD KEY idx_lesson_sessions_status_created (status, created_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_ls_starts := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'lesson_sessions'
    AND INDEX_NAME = 'idx_lesson_sessions_starts'
);

SET @sql := IF(
  @has_idx_ls_starts = 0,
  'ALTER TABLE lesson_sessions
     ADD KEY idx_lesson_sessions_starts (starts_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- student_teacher_selections active-load subquery by status/teacher/subject
-- ---------------------------------------------------------------------------
SET @has_idx_sts_status_teacher_subject := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'student_teacher_selections'
    AND INDEX_NAME = 'idx_sts_status_teacher_subject'
);

SET @sql := IF(
  @has_idx_sts_status_teacher_subject = 0,
  'ALTER TABLE student_teacher_selections
     ADD KEY idx_sts_status_teacher_subject (status, teacher_id, subject_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- teacher_schedules ordered list by teacher/weekday/time
-- ---------------------------------------------------------------------------
SET @has_idx_teacher_schedules_teacher_weekday_time := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'teacher_schedules'
    AND INDEX_NAME = 'idx_teacher_schedules_teacher_weekday_time'
);

SET @sql := IF(
  @has_idx_teacher_schedules_teacher_weekday_time = 0,
  'ALTER TABLE teacher_schedules
     ADD KEY idx_teacher_schedules_teacher_weekday_time (teacher_id, weekday, start_time)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- parent_students list ordering and filtered lookups
-- ---------------------------------------------------------------------------
SET @has_idx_parent_students_created := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'parent_students'
    AND INDEX_NAME = 'idx_parent_students_created'
);

SET @sql := IF(
  @has_idx_parent_students_created = 0,
  'ALTER TABLE parent_students
     ADD KEY idx_parent_students_created (created_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
