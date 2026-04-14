-- Migration 010: Legacy teacher_ratings bootstrap/reconcile script.
-- NOTE:
--   This was previously named 002_teacher_ratings.sql and was renumbered to
--   keep migration prefixes strictly monotonic.
--
-- Design notes:
--   - One rating per lesson session in v1 (enforced with a UNIQUE KEY on
--     lesson_session_id).
--   - A rating may be created either by a student directly or by a parent on
--     behalf of a linked child, so student_id / parent_id are nullable and the
--     application layer decides which one is set.
--   - is_hidden is stored now so future moderation can suppress a rating from
--     aggregates without deleting the underlying record.
--   - stars validation is enforced in the application layer for broad MySQL /
--     MariaDB compatibility.

CREATE TABLE IF NOT EXISTS teacher_ratings (
  id                INT        NOT NULL AUTO_INCREMENT,
  lesson_session_id INT        NOT NULL
                     COMMENT 'FK → lesson_sessions.id; exactly one rating per session',
  teacher_id        INT        NOT NULL
                     COMMENT 'FK → teachers.id; denormalized for fast aggregates',
  student_id        INT        NULL
                     COMMENT 'FK → students.id; set for direct student ratings and parent child context',
  parent_id         INT        NULL
                     COMMENT 'FK → parents.id; set only when a parent submitted the rating',
  stars             TINYINT    NOT NULL
                     COMMENT '1..5 star rating (validated in application logic)',
  comment           TEXT       NULL
                     COMMENT 'Optional short written review',
  is_hidden         TINYINT(1) NOT NULL DEFAULT 0
                     COMMENT 'Future moderation flag; hidden ratings are excluded from aggregates',
  created_at        DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_teacher_ratings_session (lesson_session_id),
  KEY idx_teacher_ratings_teacher (teacher_id),
  KEY idx_teacher_ratings_student (student_id),
  KEY idx_teacher_ratings_parent (parent_id),

  CONSTRAINT fk_teacher_ratings_session
    FOREIGN KEY (lesson_session_id) REFERENCES lesson_sessions (id),

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
