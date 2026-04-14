-- Migration 008: Create password_reset_otps table for reset flow challenges.
-- This migration is intentionally explicit so runtime request handlers do not
-- perform DDL in production.

CREATE TABLE IF NOT EXISTS password_reset_otps (
  otp_id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  user_id BIGINT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_otps_email (email),
  INDEX idx_password_reset_otps_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
