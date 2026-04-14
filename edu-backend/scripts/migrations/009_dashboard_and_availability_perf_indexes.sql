-- Migration 009: High-traffic dashboard/list and availability indexes.
-- Safe to run multiple times using information_schema guards.

SET @db_name := DATABASE();

SET @has_idx_notifications_user_read_created := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'notifications'
    AND INDEX_NAME = 'idx_notifications_user_read_created'
);
SET @sql := IF(
  @has_idx_notifications_user_read_created = 0,
  'ALTER TABLE notifications ADD KEY idx_notifications_user_read_created (user_id, is_read, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_lesson_sessions_student_status_starts := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'lesson_sessions'
    AND INDEX_NAME = 'idx_lesson_sessions_student_status_starts'
);
SET @sql := IF(
  @has_idx_lesson_sessions_student_status_starts = 0,
  'ALTER TABLE lesson_sessions ADD KEY idx_lesson_sessions_student_status_starts (student_id, status, starts_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_lesson_sessions_teacher_status_starts_ends := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'lesson_sessions'
    AND INDEX_NAME = 'idx_lesson_sessions_teacher_status_starts_ends'
);
SET @sql := IF(
  @has_idx_lesson_sessions_teacher_status_starts_ends = 0,
  'ALTER TABLE lesson_sessions ADD KEY idx_lesson_sessions_teacher_status_starts_ends (teacher_id, status, starts_at, ends_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_parent_change_requests_parent_created_status := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'parent_change_requests'
    AND INDEX_NAME = 'idx_parent_change_requests_parent_created_status'
);
SET @sql := IF(
  @has_idx_parent_change_requests_parent_created_status = 0,
  'ALTER TABLE parent_change_requests ADD KEY idx_parent_change_requests_parent_created_status (parent_id, created_at, status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_teacher_schedule_exceptions_teacher_date_active_window := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'teacher_schedule_exceptions'
    AND INDEX_NAME = 'idx_teacher_schedule_exceptions_teacher_date_active_window'
);
SET @sql := IF(
  @has_idx_teacher_schedule_exceptions_teacher_date_active_window = 0,
  'ALTER TABLE teacher_schedule_exceptions ADD KEY idx_teacher_schedule_exceptions_teacher_date_active_window (teacher_id, exception_date, is_active, start_time, end_time)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_lesson_session_students_session_id := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'lesson_session_students'
    AND INDEX_NAME = 'idx_lesson_session_students_session_id'
);
SET @sql := IF(
  @has_idx_lesson_session_students_session_id = 0,
  'ALTER TABLE lesson_session_students ADD KEY idx_lesson_session_students_session_id (session_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
