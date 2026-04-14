-- Migration 003: Create refunds table
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
--
-- Design notes:
--   - Refunds are additive records — we NEVER overwrite a payment row to
--     record a refund; we INSERT here and then update payment.status to
--     'refunded' only when a refund is approved.
--   - amount_cents supports partial refunds (< payment.amount_cents).
--   - resolved_by_user_id / resolved_at record who actioned the refund and
--     when; useful for audit and dispute handling.
--   - gateway_refund_id is left NULL until a real provider is wired.
--   - A payment can have at most one pending refund at a time (enforced in
--     the application layer; no partial-refund batches for v1).

CREATE TABLE IF NOT EXISTS refunds (
  id                    INT     NOT NULL AUTO_INCREMENT,
  payment_id            INT     NOT NULL
                          COMMENT 'FK → payments.id',
  requested_by_user_id  INT     NOT NULL
                          COMMENT 'FK → users.id; parent who requested the refund',
  amount_cents          INT UNSIGNED NOT NULL
                          COMMENT 'Amount to refund; must be ≤ payments.amount_cents',
  reason                TEXT    NULL
                          COMMENT 'Free-text reason provided by the requester',
  status                ENUM('pending','approved','rejected')
                          NOT NULL DEFAULT 'pending',
  -- Gateway columns (NULL until a provider is wired)
  gateway_refund_id     VARCHAR(255) NULL
                          COMMENT 'Provider-assigned refund reference',
  -- Resolution tracking
  resolved_by_user_id   INT     NULL
                          COMMENT 'FK → users.id; admin who approved or rejected',
  resolved_at           DATETIME NULL,

  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_payment   (payment_id),
  KEY idx_requester (requested_by_user_id),
  KEY idx_status    (status),

  CONSTRAINT fk_refund_payment
    FOREIGN KEY (payment_id) REFERENCES payments (id),

  CONSTRAINT fk_refund_requester
    FOREIGN KEY (requested_by_user_id) REFERENCES users (id),

  CONSTRAINT fk_refund_resolver
    FOREIGN KEY (resolved_by_user_id) REFERENCES users (id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Refund requests against a paid payment. Never overwrites payment state directly.';
