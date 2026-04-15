// src/controllers/payment.controller.js
// ============================================================================
// Payment Controller — internal state machine only, no live gateway
// ----------------------------------------------------------------------------
// Endpoints:
//   POST /payment/initiate               parent creates a payment for a session
//   GET  /payment/my                     list caller's own payments
//   GET  /payment/:paymentId             fetch one payment (own or admin)
//   POST /payment/:paymentId/confirm     STUB → mark paid (gateway webhook target)
//   POST /payment/:paymentId/fail        STUB → mark failed (gateway failure target)
//
// State machine:
//   pending ──► paid      (via confirmPayment)
//   pending ──► failed    (via failPayment)
//   paid    ──► refunded  (via refund.controller approveRefund — NOT directly here)
//
// Gateway integration:
//   When wiring a real provider, replace the stub bodies of confirmPayment /
//   failPayment with signature verification + provider SDK calls.
//   The internal transition helpers (transitionPaymentStatus, emitBillingEvent)
//   remain unchanged.
// ============================================================================

import pool from "../db.js";

// ----------------------------------------------------------------------------
// Small helpers — mirrors the pattern used in teacher.controller.js
// ----------------------------------------------------------------------------

function getAuthUser(req) {
  const u = req.session?.user;
  if (!u?.id || !Number.isFinite(Number(u.id))) return null;
  return { id: Number(u.id), role: String(u.role ?? "").toLowerCase() };
}

function badRequest(res, message, extra) {
  return res.status(400).json({ success: false, message, ...(extra ?? {}) });
}
function unauthorized(res) {
  return res.status(401).json({ success: false, message: "Authentication required." });
}
function forbidden(res, message = "Access denied.") {
  return res.status(403).json({ success: false, message });
}
function notFound(res, message = "Not found.") {
  return res.status(404).json({ success: false, message });
}
function serverError(res, scope, err) {
  console.error(`[paymentController][${scope}]`, err);
  return res.status(500).json({ success: false, message: "Server error." });
}
function toPositiveInt(v) {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ----------------------------------------------------------------------------
// State machine definition
// ----------------------------------------------------------------------------
// Export so refund.controller.js can reuse transitionPaymentStatus.

const PAYMENT_TRANSITIONS = {
  pending:  new Set(["paid", "failed"]),
  paid:     new Set(["refunded"]),
  failed:   new Set([]),
  refunded: new Set([]),
};

// ----------------------------------------------------------------------------
// Shared internal utilities (exported for refund.controller.js)
// ----------------------------------------------------------------------------

/**
 * Append one row to billing_events (call inside an open transaction).
 *
 * @param {import("mysql2/promise").PoolConnection} conn
 * @param {{ paymentId: number, refundId?: number|null, eventType: string,
 *           actorUserId?: number|null, payload?: object|null }} opts
 */
export async function emitBillingEvent(conn, { paymentId, refundId = null, eventType, actorUserId = null, payload = null }) {
  await conn.query(
    `INSERT INTO billing_events (payment_id, refund_id, event_type, actor_user_id, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [paymentId, refundId, eventType, actorUserId, payload ? JSON.stringify(payload) : null]
  );
}

/**
 * Apply a status transition to a payment row inside an already-open
 * transaction.  Uses SELECT … FOR UPDATE to prevent concurrent transitions.
 *
 * Returns:
 *   { ok: true,  previous: string }            — transition applied
 *   { ok: false, notFound: true }               — payment row missing
 *   { ok: false, invalidTransition: true,
 *                current: string }              — transition not allowed
 *
 * @param {import("mysql2/promise").PoolConnection} conn
 * @param {number} paymentId
 * @param {"paid"|"failed"|"refunded"} toStatus
 * @param {number|null} actorUserId
 * @param {{ gatewayPaymentId?: string, gatewayResponse?: object }} extra
 */
export async function transitionPaymentStatus(conn, paymentId, toStatus, actorUserId, extra = {}) {
  const [rows] = await conn.query(
    `SELECT id, status FROM payments WHERE id = ? FOR UPDATE`,
    [paymentId]
  );
  if (!rows.length) return { ok: false, notFound: true };

  const current = rows[0].status;
  if (!PAYMENT_TRANSITIONS[current]?.has(toStatus)) {
    return { ok: false, invalidTransition: true, current };
  }

  const now = new Date();
  const setClause = { status: toStatus, updated_at: now };
  if (toStatus === "paid")     setClause.paid_at   = now;
  if (toStatus === "failed")   setClause.failed_at  = now;
  if (extra.gatewayPaymentId)  setClause.gateway_payment_id = extra.gatewayPaymentId;
  if (extra.gateway)           setClause.gateway            = extra.gateway;
  if (extra.gatewayResponse)   setClause.gateway_response   = JSON.stringify(extra.gatewayResponse);

  await conn.query(`UPDATE payments SET ? WHERE id = ?`, [setClause, paymentId]);
  return { ok: true, previous: current };
}

// ----------------------------------------------------------------------------
// Internal: per-state recovery guidance
// ----------------------------------------------------------------------------

/**
 * Return an explicit, human-readable recovery object for the combined
 * payment + refund state.  This is the single source of truth for
 * "what should the user do next?" across checkout page and any future views.
 *
 * @param {"pending"|"paid"|"failed"|"refunded"|null} paymentStatus
 * @param {"pending"|"approved"|"rejected"|null}      refundStatus
 * @returns {{ state: string, message: string, actionable: boolean }}
 */
export function buildRecoveryGuidance(paymentStatus, refundStatus) {
  if (!paymentStatus) {
    return {
      state:      "no_payment",
      message:    "No payment record exists for this session. " +
                  "Payment is arranged offline — contact your coordinator.",
      actionable: true,
    };
  }

  if (paymentStatus === "pending") {
    return {
      state:      "payment_pending",
      message:    "Payment is pending confirmation. " +
                  "Contact your coordinator to confirm the payment arrangement for this session.",
      actionable: true,
    };
  }

  if (paymentStatus === "failed") {
    return {
      state:      "payment_failed",
      message:    "Payment was not confirmed. " +
                  "Contact your coordinator to arrange an alternative payment for this session.",
      actionable: true,
    };
  }

  if (paymentStatus === "paid") {
    if (!refundStatus) {
      return { state: "paid", message: "Payment confirmed.", actionable: false };
    }
    if (refundStatus === "pending") {
      return {
        state:      "refund_pending",
        message:    "Your refund request is under review. An admin will process it shortly.",
        actionable: false,
      };
    }
    if (refundStatus === "approved") {
      return {
        state:      "refund_approved",
        message:    "Refund has been approved and will be processed by your coordinator.",
        actionable: false,
      };
    }
    if (refundStatus === "rejected") {
      return {
        state:      "refund_rejected",
        message:    "Your refund request was not approved. " +
                    "Contact your coordinator if you have questions.",
        actionable: true,
      };
    }
  }

  if (paymentStatus === "refunded") {
    return {
      state:      "refunded",
      message:    "Payment has been fully refunded.",
      actionable: false,
    };
  }

  return {
    state:      "unknown",
    message:    "Payment state is unclear. Contact your coordinator.",
    actionable: true,
  };
}

// ----------------------------------------------------------------------------
// GET /payment/session/:sessionId
// ----------------------------------------------------------------------------
/**
 * Session-centric payment read model.
 * Returns the payment record, the most-recent refund, and explicit recovery
 * guidance — all in one response, so callers never need to filter listMine()
 * client-side or make separate getRefund() calls.
 *
 * Access: the session's payer (parent) or admin.
 * For the "no payment yet" case, access is verified via parent_students linkage.
 */
export async function getPaymentBySession(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);

  const sessionId = toPositiveInt(req.params?.sessionId);
  if (!sessionId) return badRequest(res, "sessionId must be a positive integer.");

  try {
    // Load payment for this session
    const [payRows] = await pool.query(
      `SELECT
         p.id, p.session_id, p.payer_user_id, p.amount_cents, p.currency,
         p.status, p.gateway, p.gateway_payment_id,
         p.paid_at, p.failed_at, p.created_at, p.updated_at,
         ls.starts_at, ls.ends_at,
         s.name_en AS subject_name_en, s.name_ar AS subject_name_ar
       FROM payments p
       LEFT JOIN lesson_sessions ls ON ls.id = p.session_id
       LEFT JOIN subjects         s  ON s.id  = ls.subject_id
       WHERE p.session_id = ?
       LIMIT 1`,
      [sessionId]
    );

    if (!payRows.length) {
      // No payment record — verify the caller has access to this session before
      // returning any information, even "no payment".
      if (user.role !== "admin") {
        const [sessionCheck] = await pool.query(
          `SELECT 1
           FROM lesson_sessions ls
           JOIN parent_students ps ON ps.student_id = ls.student_id
           JOIN parents p          ON p.id           = ps.parent_id
           WHERE ls.id = ? AND p.user_id = ?
           LIMIT 1`,
          [sessionId, user.id]
        );
        if (!sessionCheck.length) {
          return notFound(res, "Session not found or access denied.");
        }
      }

      return res.json({
        success: true,
        data: {
          payment:  null,
          refund:   null,
          recovery: buildRecoveryGuidance(null, null),
        },
      });
    }

    const payment = payRows[0];

    // Non-admins may only read their own payment
    if (user.role !== "admin" && payment.payer_user_id !== user.id) {
      return forbidden(res);
    }

    // Load the most recent refund for this payment (if any)
    const [refundRows] = await pool.query(
      `SELECT id, payment_id, amount_cents, reason, status,
              gateway_refund_id, resolved_by_user_id, resolved_at,
              created_at, updated_at
       FROM refunds
       WHERE payment_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [payment.id]
    );
    const refund = refundRows[0] ?? null;

    const recovery = buildRecoveryGuidance(payment.status, refund?.status ?? null);

    return res.json({ success: true, data: { payment, refund, recovery } });
  } catch (err) {
    return serverError(res, "getPaymentBySession", err);
  }
}

// ----------------------------------------------------------------------------
// POST /payment/initiate
// ----------------------------------------------------------------------------
/**
 * Parent creates a payment record for a confirmed session booking.
 * Status starts as "pending"; no money moves yet.
 *
 * NOTE: Payments are intentionally offline/manual for this platform (see SYSTEM_ARCHITECTURE_AUTHORITY §9).
 * No authoritative server-side pricing source exists. This endpoint is intentionally blocked
 * to prevent arbitrary client-controlled amounts from being persisted.
 * When a gateway and server-side pricing are wired up, remove the early-return block below
 * and derive amount_cents from the authoritative source (session price / teacher rate).
 *
 * Body: { session_id, currency? }
 */
export async function initiatePayment(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);
  if (user.role !== "parent" && user.role !== "admin") {
    return forbidden(res, "Only parents can initiate payments.");
  }

  // Keep initiate gated behind an explicit feature flag. This preserves the
  // current offline/manual posture while allowing a fully-wired path in
  // environments where pricing + gateway bootstrap is ready.
  const paymentGatewayEnabled = String(process.env.PAYMENT_GATEWAY_ENABLED || "").toLowerCase() === "true";
  if (!paymentGatewayEnabled) {
    return res.status(503).json({
      success: false,
      code:    "PAYMENT_NOT_CONFIGURED",
      message: "Online payment is not yet configured for this platform. " +
               "Payment is arranged offline — please contact your coordinator.",
    });
  }

  const sessionId = toPositiveInt(req.body?.session_id ?? req.body?.sessionId);
  if (!sessionId) return badRequest(res, "session_id must be a positive integer.");

  const currencyRaw = String(req.body?.currency || "EGP").trim().toUpperCase();
  const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : "EGP";

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    // Parent can only initiate for their linked student session; admin can do any.
    let sessionRow = null;
    if (user.role === "admin") {
      const [rows] = await conn.query(
        `SELECT ls.id, ls.teacher_id, t.hourly_rate
         FROM lesson_sessions ls
         LEFT JOIN teachers t ON t.id = ls.teacher_id
         WHERE ls.id = ?
         LIMIT 1`,
        [sessionId]
      );
      sessionRow = rows[0] ?? null;
    } else {
      const [rows] = await conn.query(
        `SELECT ls.id, ls.teacher_id, t.hourly_rate
         FROM lesson_sessions ls
         LEFT JOIN teachers t  ON t.id = ls.teacher_id
         JOIN parent_students ps ON ps.student_id = ls.student_id
         JOIN parents p          ON p.id = ps.parent_id
         WHERE ls.id = ?
           AND p.user_id = ?
         LIMIT 1`,
        [sessionId, user.id]
      );
      sessionRow = rows[0] ?? null;
    }

    if (!sessionRow) {
      await conn.rollback();
      txStarted = false;
      return notFound(res, "Session not found or access denied.");
    }

    // Duplicate guard: keep one active payment lifecycle per session.
    const [existingRows] = await conn.query(
      `SELECT id, status
       FROM payments
       WHERE session_id = ?
         AND status IN ('pending', 'paid', 'refunded')
       ORDER BY created_at DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [sessionId]
    );
    if (existingRows.length) {
      await conn.rollback();
      txStarted = false;
      return badRequest(
        res,
        "An active payment already exists for this session.",
        { code: "PAYMENT_ALREADY_EXISTS", paymentId: existingRows[0].id, status: existingRows[0].status }
      );
    }

    const hourlyRate = Number(sessionRow.hourly_rate);
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      await conn.rollback();
      txStarted = false;
      return res.status(503).json({
        success: false,
        code: "PAYMENT_PRICING_NOT_CONFIGURED",
        message:
          "Payment pricing is not configured for this session yet. Please contact your coordinator.",
      });
    }
    const amountCents = Math.round(hourlyRate * 100);

    const [insertResult] = await conn.query(
      `INSERT INTO payments (session_id, payer_user_id, amount_cents, currency, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [sessionId, user.id, amountCents, currency]
    );
    const paymentId = Number(insertResult.insertId);

    // Emit initiation event so billing_events captures the full lifecycle.
    await emitBillingEvent(conn, {
      paymentId,
      eventType: "payment.initiated",
      actorUserId: user.id,
      payload: {
        session_id: sessionId,
        amount_cents: amountCents,
        currency,
        pricing_source: "teacher.hourly_rate",
      },
    });

    await conn.commit();
    txStarted = false;

    return res.status(201).json({
      success: true,
      message: "Payment initiated.",
      data: { paymentId, sessionId, status: "pending", amount_cents: amountCents, currency },
    });
  } catch (err) {
    if (txStarted) await conn.rollback().catch(() => {});
    return serverError(res, "initiatePayment", err);
  } finally {
    conn.release();
  }
}

// ----------------------------------------------------------------------------
// GET /payment/my
// ----------------------------------------------------------------------------
/**
 * Returns all payments made by the authenticated user, newest first.
 * Joins session + subject for display context.
 */
export async function listMyPayments(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);

  // Optional ?limit query param; default 50, max 100.
  const DEFAULT_LIMIT = 50;
  const MAX_LIMIT     = 100;
  const rawLimit = req.query?.limit != null ? Math.trunc(Number(req.query.limit)) : DEFAULT_LIMIT;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= MAX_LIMIT
    ? rawLimit
    : DEFAULT_LIMIT;

  try {
    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.session_id,
         p.amount_cents,
         p.currency,
         p.status,
         p.gateway,
         p.paid_at,
         p.failed_at,
         p.created_at,
         ls.starts_at,
         ls.ends_at,
         s.name_en AS subject_name_en,
         s.name_ar AS subject_name_ar,
         r.id     AS refund_id,
         r.status AS refund_status
       FROM payments p
       LEFT JOIN lesson_sessions ls ON ls.id = p.session_id
       LEFT JOIN subjects         s  ON s.id  = ls.subject_id
       -- Join most-recent refund per payment (correlated subquery is safe here;
       -- payment list is bounded by payer_user_id so result set is small)
       LEFT JOIN refunds r ON r.id = (
         SELECT id FROM refunds
         WHERE payment_id = p.id
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       )
       WHERE p.payer_user_id = ?
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [user.id, limit]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return serverError(res, "listMyPayments", err);
  }
}

// ----------------------------------------------------------------------------
// GET /payment/:paymentId
// ----------------------------------------------------------------------------
/**
 * Fetch a single payment.
 * A user can only read their own payment; admins can read any.
 */
export async function getPayment(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  try {
    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.session_id,
         p.payer_user_id,
         p.amount_cents,
         p.currency,
         p.status,
         p.gateway,
         p.gateway_payment_id,
         p.paid_at,
         p.failed_at,
         p.created_at,
         p.updated_at
       FROM payments p
       WHERE p.id = ?
       LIMIT 1`,
      [paymentId]
    );
    if (!rows.length) return notFound(res, "Payment not found.");

    const row = rows[0];
    if (user.role !== "admin" && row.payer_user_id !== user.id) {
      return forbidden(res);
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    return serverError(res, "getPayment", err);
  }
}

// ----------------------------------------------------------------------------
// POST /payment/:paymentId/confirm  — STUB (gateway webhook target)
// ----------------------------------------------------------------------------
/**
 * Marks a pending payment as paid.
 * Currently admin-only.
 *
 * TODO(gateway): When wiring a real provider:
 *   1. Remove the admin-only guard.
 *   2. Validate the provider's webhook signature (HMAC / RSA) before entering
 *      this function.
 *   3. Extract gateway_payment_id and gateway_response from the provider
 *      webhook body instead of req.body.
 *   4. Make the endpoint unauthenticated (session-free) since gateway
 *      callbacks do not carry a session cookie.
 *
 * Body: { gateway_payment_id?, gateway_response? }
 */
export async function confirmPayment(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);
  if (user.role !== "admin") return forbidden(res, "Admin only — stub endpoint.");

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    const result = await transitionPaymentStatus(conn, paymentId, "paid", user.id, {
      gatewayPaymentId: req.body?.gateway_payment_id ?? null,
      gateway:          req.body?.gateway ?? null,
      gatewayResponse:  req.body?.gateway_response ?? null,
    });

    if (result.notFound)         { await conn.rollback(); return notFound(res, "Payment not found."); }
    if (result.invalidTransition) {
      await conn.rollback();
      return badRequest(res, `Cannot move payment from '${result.current}' to 'paid'.`);
    }

    await emitBillingEvent(conn, {
      paymentId,
      eventType:   "payment.paid",
      actorUserId: user.id,
      payload:     { gateway_payment_id: req.body?.gateway_payment_id ?? null, previous: result.previous },
    });

    await conn.commit();
    txStarted = false;
    return res.json({ success: true, message: "Payment confirmed.", data: { paymentId, status: "paid" } });
  } catch (err) {
    if (txStarted) await conn.rollback().catch(() => {});
    return serverError(res, "confirmPayment", err);
  } finally {
    conn.release();
  }
}

// ----------------------------------------------------------------------------
// POST /payment/:paymentId/fail  — STUB (gateway failure callback target)
// ----------------------------------------------------------------------------
/**
 * Marks a pending payment as failed.
 * Currently admin-only.
 *
 * TODO(gateway): Same notes as confirmPayment — remove guard, verify signature.
 *
 * Body: { gateway_response? }
 */
export async function failPayment(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);
  if (user.role !== "admin") return forbidden(res, "Admin only — stub endpoint.");

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    const result = await transitionPaymentStatus(conn, paymentId, "failed", user.id, {
      gatewayResponse: req.body?.gateway_response ?? null,
    });

    if (result.notFound)         { await conn.rollback(); return notFound(res, "Payment not found."); }
    if (result.invalidTransition) {
      await conn.rollback();
      return badRequest(res, `Cannot move payment from '${result.current}' to 'failed'.`);
    }

    await emitBillingEvent(conn, {
      paymentId,
      eventType:   "payment.failed",
      actorUserId: user.id,
      payload:     { previous: result.previous },
    });

    await conn.commit();
    txStarted = false;
    return res.json({ success: true, message: "Payment marked as failed.", data: { paymentId, status: "failed" } });
  } catch (err) {
    if (txStarted) await conn.rollback().catch(() => {});
    return serverError(res, "failPayment", err);
  } finally {
    conn.release();
  }
}
