-- Migration 002: Create payments table
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
--
-- Design notes:
--   - session_id is nullable so the table can support future non-session
--     charges (subscriptions, top-ups) without schema changes.
--   - amount_cents stores value in the smallest currency unit (avoids float
--     rounding errors).
--   - gateway / gateway_payment_id / gateway_response are left NULL until a
--     real provider is wired; the columns are already in the schema so that
--     integration does not require a migration.
--   - status uses ENUM to enforce the allowed state machine values at DB level.
--   - UNIQUE KEY on session_id prevents duplicate payments for the same
--     session.

CREATE TABLE IF NOT EXISTS payments (
  id                  INT          NOT NULL AUTO_INCREMENT,
  session_id          INT          NULL
                        COMMENT 'FK → lesson_sessions.id; NULL for non-session charges',
  payer_user_id       INT          NOT NULL
                        COMMENT 'FK → users.id; the user who owes / paid',
  amount_cents        INT UNSIGNED NOT NULL
                        COMMENT 'Payment amount in smallest currency unit (e.g. piastres for EGP)',
  currency            CHAR(3)      NOT NULL DEFAULT 'EGP'
                        COMMENT 'ISO 4217 currency code',
  status              ENUM('pending','paid','failed','refunded')
                        NOT NULL DEFAULT 'pending'
                        COMMENT 'Payment state machine: pending→paid or pending→failed; paid→refunded',
  -- Gateway integration columns (NULL until a provider is wired)
  gateway             VARCHAR(50)  NULL
                        COMMENT 'e.g. stripe, paymob, fawry — NULL = manual/stub',
  gateway_payment_id  VARCHAR(255) NULL
                        COMMENT 'Provider-assigned payment reference',
  gateway_response    JSON         NULL
                        COMMENT 'Raw provider response payload for debugging / dispute resolution',
  -- Timestamp sentinels for each terminal state
  paid_at             DATETIME     NULL,
  failed_at           DATETIME     NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Prevent two payments for the same session
  UNIQUE KEY uq_session_payment (session_id),

  KEY idx_payer  (payer_user_id),
  KEY idx_status (status),

  CONSTRAINT fk_payment_session
    FOREIGN KEY (session_id) REFERENCES lesson_sessions (id)
    ON DELETE SET NULL,

  CONSTRAINT fk_payment_payer
    FOREIGN KEY (payer_user_id) REFERENCES users (id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='One record per payment attempt. State is managed via explicit transitions only.';
