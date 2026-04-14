-- Migration 001: Add cancellation metadata columns to lesson_sessions
-- Safe to run multiple times (IF NOT EXISTS guard).
--
-- cancel_reason already exists in most deployments; adding it here is a no-op
-- if it is already present.  cancelled_by and cancelled_at are new.

ALTER TABLE lesson_sessions
  ADD COLUMN IF NOT EXISTS cancel_reason  TEXT         NULL  COMMENT 'Free-text reason provided at cancellation',
  ADD COLUMN IF NOT EXISTS cancelled_by   VARCHAR(20)  NULL  COMMENT 'Who cancelled: student|teacher|parent|admin|system',
  ADD COLUMN IF NOT EXISTS cancelled_at   DATETIME     NULL  COMMENT 'Cairo-naive datetime when the session was cancelled';
