-- Migration 004: Create billing_events audit log table
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
--
-- Design notes:
--   - Append-only log; rows are never updated or deleted.
--   - Captures every transition in the payment/refund state machine.
--   - actor_user_id is NULL when the event originates from a gateway webhook
--     or a scheduled system process.
--   - payload stores the relevant context snapshot (previous state, gateway
--     reference, etc.) so the log is self-contained for audit purposes.
--
-- Event type vocabulary (evolve as the module grows):
--   payment.created       – new payment record inserted
--   payment.paid          – payment confirmed as paid
--   payment.failed        – payment marked failed
--   refund.requested      – parent submitted a refund request
--   refund.approved       – admin approved; payment moved to 'refunded'
--   refund.rejected       – admin rejected the refund request

CREATE TABLE IF NOT EXISTS billing_events (
  id             INT     NOT NULL AUTO_INCREMENT,
  payment_id     INT     NOT NULL
                   COMMENT 'FK → payments.id; always present',
  refund_id      INT     NULL
                   COMMENT 'FK → refunds.id; set only for refund-related events',
  event_type     VARCHAR(80) NOT NULL
                   COMMENT 'Dot-namespaced event identifier, e.g. payment.paid',
  actor_user_id  INT     NULL
                   COMMENT 'FK → users.id; NULL = system or gateway',
  payload        JSON    NULL
                   COMMENT 'Event context snapshot (previous state, references, etc.)',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_payment    (payment_id),
  KEY idx_event_type (event_type),
  KEY idx_actor      (actor_user_id),

  CONSTRAINT fk_billing_payment
    FOREIGN KEY (payment_id) REFERENCES payments (id),

  CONSTRAINT fk_billing_refund
    FOREIGN KEY (refund_id) REFERENCES refunds (id)
    ON DELETE SET NULL,

  CONSTRAINT fk_billing_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit log of all payment and refund state transitions.';
