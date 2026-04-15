-- Migration 011: Enforce referential integrity for password_reset_otps.user_id.
-- Safe to run multiple times.
--
-- Why:
-- - password_reset_otps is part of identity-sensitive reset workflows and should
--   follow the same authoritative linkage rules as other auth-domain tables.
-- - users.id is INT, so password_reset_otps.user_id must match that contract.
--
-- Cleanup semantics:
-- - Expired reset rows are deleted proactively.
-- - Rows with invalid/orphaned user linkage are removed before FK enforcement.
-- - On user deletion, related reset rows are cascade-deleted.

SET @db_name := DATABASE();

-- ---------------------------------------------------------------------------
-- A) Trim rows that are no longer valid for reset lifecycle.
-- ---------------------------------------------------------------------------
DELETE FROM password_reset_otps
WHERE expires_at <= NOW();

DELETE pro
FROM password_reset_otps pro
LEFT JOIN users u
  ON u.id = pro.user_id
WHERE u.id IS NULL
   OR pro.user_id IS NULL
   OR pro.user_id <= 0
   OR pro.user_id > 2147483647;

-- ---------------------------------------------------------------------------
-- B) Align password_reset_otps.user_id type with users.id (INT NOT NULL).
-- ---------------------------------------------------------------------------
SET @password_reset_user_id_is_int := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'password_reset_otps'
    AND COLUMN_NAME = 'user_id'
    AND DATA_TYPE = 'int'
    AND COLUMN_TYPE = 'int(11)'
    AND IS_NULLABLE = 'NO'
);

SET @align_password_reset_user_id_sql := IF(
  @password_reset_user_id_is_int = 0,
  'ALTER TABLE password_reset_otps
     MODIFY COLUMN user_id INT NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @align_password_reset_user_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure supporting index exists for predictable FK maintenance/perf.
SET @has_idx_password_reset_otps_user_id := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'password_reset_otps'
    AND INDEX_NAME = 'idx_password_reset_otps_user_id'
);

SET @add_idx_password_reset_otps_user_id_sql := IF(
  @has_idx_password_reset_otps_user_id = 0,
  'ALTER TABLE password_reset_otps
     ADD KEY idx_password_reset_otps_user_id (user_id)',
  'SELECT 1'
);
PREPARE stmt FROM @add_idx_password_reset_otps_user_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- C) Enforce explicit FK linkage to users(id).
-- ---------------------------------------------------------------------------
SET @has_password_reset_user_fk := (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'password_reset_otps'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_SCHEMA = @db_name
    AND REFERENCED_TABLE_NAME = 'users'
    AND REFERENCED_COLUMN_NAME = 'id'
);

SET @add_password_reset_user_fk_sql := IF(
  @has_password_reset_user_fk = 0,
  'ALTER TABLE password_reset_otps
     ADD CONSTRAINT fk_password_reset_otps_user
       FOREIGN KEY (user_id) REFERENCES users(id)
       ON UPDATE RESTRICT ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @add_password_reset_user_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
