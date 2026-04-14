-- Migration 005: Reconcile teacher_ratings to the Phase 2 canonical schema.
-- Safe to run multiple times.
--
-- Why a new migration instead of editing 002_teacher_ratings.sql?
--   - The repository already contains an older teacher_ratings migration.
--   - This file preserves migration history while moving the schema to the
--     canonical Phase 2 contract:
--       * session_id naming
--       * one rating per session
--       * hidden-rating index for moderation-ready aggregates

CREATE TABLE IF NOT EXISTS teacher_ratings (
  id         INT        NOT NULL AUTO_INCREMENT,
  session_id INT        NOT NULL
               COMMENT 'FK -> lesson_sessions.id; exactly one rating per session',
  teacher_id INT        NOT NULL
               COMMENT 'FK -> teachers.id; denormalized for fast aggregates',
  student_id INT        NULL
               COMMENT 'FK -> students.id; set for direct student ratings or parent child context',
  parent_id  INT        NULL
               COMMENT 'FK -> parents.id; set only when a parent submitted the rating',
  stars      TINYINT    NOT NULL
               COMMENT '1..5 star rating (validated in application logic)',
  comment    TEXT       NULL
               COMMENT 'Optional written review',
  is_hidden  TINYINT(1) NOT NULL DEFAULT 0
               COMMENT 'Future moderation flag; hidden ratings are excluded from aggregates',
  created_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_teacher_ratings_session (session_id),
  KEY idx_teacher_ratings_teacher (teacher_id),
  KEY idx_teacher_ratings_student (student_id),
  KEY idx_teacher_ratings_parent (parent_id),
  KEY idx_teacher_ratings_hidden (is_hidden),

  CONSTRAINT fk_teacher_ratings_session
    FOREIGN KEY (session_id) REFERENCES lesson_sessions (id),

  CONSTRAINT fk_teacher_ratings_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers (id),

  CONSTRAINT fk_teacher_ratings_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON DELETE SET NULL,

  CONSTRAINT fk_teacher_ratings_parent
    FOREIGN KEY (parent_id) REFERENCES parents (id)
    ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Teacher ratings submitted within 7 days of a completed lesson session.';

-- Reconcile legacy schema from 002_teacher_ratings.sql if it already created
-- lesson_session_id instead of the canonical session_id.
SET @has_legacy_session_col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teacher_ratings'
    AND COLUMN_NAME = 'lesson_session_id'
);

SET @has_canonical_session_col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teacher_ratings'
    AND COLUMN_NAME = 'session_id'
);

SET @rename_legacy_session_sql := IF(
  @has_legacy_session_col = 1 AND @has_canonical_session_col = 0,
  'ALTER TABLE teacher_ratings
     DROP FOREIGN KEY fk_teacher_ratings_session,
     DROP INDEX uq_teacher_ratings_session,
     CHANGE COLUMN lesson_session_id session_id INT NOT NULL
       COMMENT ''FK -> lesson_sessions.id; exactly one rating per session''',
  'SELECT 1'
);
PREPARE stmt FROM @rename_legacy_session_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @readd_canonical_session_constraints_sql := IF(
  @has_legacy_session_col = 1 AND @has_canonical_session_col = 0,
  'ALTER TABLE teacher_ratings
     ADD UNIQUE KEY uq_teacher_ratings_session (session_id),
     ADD CONSTRAINT fk_teacher_ratings_session
       FOREIGN KEY (session_id) REFERENCES lesson_sessions (id)',
  'SELECT 1'
);
PREPARE stmt FROM @readd_canonical_session_constraints_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Normalize the timestamp columns/comments for both fresh and legacy tables.
ALTER TABLE teacher_ratings
  MODIFY COLUMN session_id INT NOT NULL
    COMMENT 'FK -> lesson_sessions.id; exactly one rating per session',
  MODIFY COLUMN teacher_id INT NOT NULL
    COMMENT 'FK -> teachers.id; denormalized for fast aggregates',
  MODIFY COLUMN student_id INT NULL
    COMMENT 'FK -> students.id; set for direct student ratings or parent child context',
  MODIFY COLUMN parent_id INT NULL
    COMMENT 'FK -> parents.id; set only when a parent submitted the rating',
  MODIFY COLUMN stars TINYINT NOT NULL
    COMMENT '1..5 star rating (validated in application logic)',
  MODIFY COLUMN comment TEXT NULL
    COMMENT 'Optional written review',
  MODIFY COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Future moderation flag; hidden ratings are excluded from aggregates',
  MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

SET @has_hidden_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teacher_ratings'
    AND INDEX_NAME = 'idx_teacher_ratings_hidden'
);

SET @add_hidden_idx_sql := IF(
  @has_hidden_idx = 0,
  'ALTER TABLE teacher_ratings ADD KEY idx_teacher_ratings_hidden (is_hidden)',
  'SELECT 1'
);
PREPARE stmt FROM @add_hidden_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
