// src/controllers/refund.controller.js
// ============================================================================
// Refund Controller
// ----------------------------------------------------------------------------
// Endpoints:
//   POST /payment/:paymentId/refund/request   parent requests a refund
//   GET  /payment/:paymentId/refund           get refund status for a payment
//   POST /payment/:paymentId/refund/approve   admin approves → payment→'refunded'
//   POST /payment/:paymentId/refund/reject    admin rejects
//
// Rules enforced here:
//   - Only the original payer (or admin) can request a refund.
//   - Refund can only be requested against a 'paid' payment.
//   - Only one active (pending) refund per payment at a time.
//   - Approving a refund transitions payment.status to 'refunded' atomically.
//   - Every state change is logged to billing_events (via emitBillingEvent).
//
// Gateway integration:
//   When wiring a real provider, add the gateway API call inside approveRefund
//   before committing; store the gateway_refund_id returned.
// ============================================================================

import pool from "../db.js";
import { emitBillingEvent, transitionPaymentStatus } from "./payment.controller.js";

// ----------------------------------------------------------------------------
// Helpers
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
  console.error(`[refundController][${scope}]`, err);
  return res.status(500).json({ success: false, message: "Server error." });
}
function toPositiveInt(v) {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ----------------------------------------------------------------------------
// POST /payment/:paymentId/refund/request
// ----------------------------------------------------------------------------
/**
 * Parent requests a refund for a paid session.
 *
 * Body: { amount_cents?, reason? }
 *   amount_cents defaults to the full payment amount if omitted.
 *   reason is optional free text.
 */
export async function requestRefund(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    // Load the payment
    const [payRows] = await conn.query(
      `SELECT id, payer_user_id, amount_cents, status
       FROM payments
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [paymentId]
    );
    if (!payRows.length) {
      await conn.rollback();
      txStarted = false;
      return notFound(res, "Payment not found.");
    }
    const payment = payRows[0];

    // Only payer or admin
    if (user.role !== "admin" && payment.payer_user_id !== user.id) {
      await conn.rollback();
      txStarted = false;
      return forbidden(res);
    }

    // Must be paid to refund
    if (payment.status !== "paid") {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, `Refunds can only be requested against a 'paid' payment (current: '${payment.status}').`);
    }

    // amount_cents defaults to full payment amount; validate if provided
    const rawAmount = req.body?.amount_cents;
    const amountCents = rawAmount == null
      ? payment.amount_cents
      : toPositiveInt(rawAmount);

    if (!amountCents) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "amount_cents must be a positive integer.");
    }
    if (amountCents > payment.amount_cents) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, `Refund amount (${amountCents}) cannot exceed payment amount (${payment.amount_cents}).`);
    }

    // Block if a pending refund already exists
    const [existingRefund] = await conn.query(
      `SELECT id, status FROM refunds WHERE payment_id = ? AND status = 'pending' LIMIT 1`,
      [paymentId]
    );
    if (existingRefund.length) {
      await conn.rollback();
      txStarted = false;
      return res.status(409).json({
        success: false,
        message: "A pending refund already exists for this payment.",
        data: { refundId: existingRefund[0].id },
      });
    }

    const [result] = await conn.query(
      `INSERT INTO refunds (payment_id, requested_by_user_id, amount_cents, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [paymentId, user.id, amountCents, reason]
    );
    const refundId = result.insertId;

    await emitBillingEvent(conn, {
      paymentId,
      refundId,
      eventType:   "refund.requested",
      actorUserId: user.id,
      payload:     { amount_cents: amountCents, reason },
    });

    await conn.commit();
    txStarted = false;

    return res.status(201).json({
      success: true,
      message: "Refund request submitted. An admin will review it shortly.",
      data: { refundId, status: "pending" },
    });
  } catch (err) {
    if (txStarted) await conn.rollback().catch(() => {});
    return serverError(res, "requestRefund", err);
  } finally {
    conn.release();
  }
}

// ----------------------------------------------------------------------------
// GET /payment/:paymentId/refund
// ----------------------------------------------------------------------------
/**
 * Returns the most-recent refund record for this payment.
 * Payer or admin can read.
 */
export async function getRefund(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  try {
    // Verify access to the parent payment first
    const [payRows] = await pool.query(
      `SELECT id, payer_user_id FROM payments WHERE id = ? LIMIT 1`,
      [paymentId]
    );
    if (!payRows.length) return notFound(res, "Payment not found.");
    if (user.role !== "admin" && payRows[0].payer_user_id !== user.id) {
      return forbidden(res);
    }

    const [refundRows] = await pool.query(
      `SELECT r.id, r.payment_id, r.amount_cents, r.reason, r.status,
              r.gateway_refund_id, r.resolved_by_user_id, r.resolved_at,
              r.created_at, r.updated_at
       FROM refunds r
       WHERE r.payment_id = ?
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [paymentId]
    );

    if (!refundRows.length) return notFound(res, "No refund found for this payment.");
    return res.json({ success: true, data: refundRows[0] });
  } catch (err) {
    return serverError(res, "getRefund", err);
  }
}

// ----------------------------------------------------------------------------
// POST /payment/:paymentId/refund/approve  — admin only
// ----------------------------------------------------------------------------
/**
 * Admin approves the pending refund.
 * Atomically:
 *   1. Updates refund.status → 'approved', sets resolved_by / resolved_at.
 *   2. Transitions payment.status → 'refunded'.
 *   3. Emits refund.approved billing event.
 *
 * TODO(gateway): After step 1 but before committing, call the provider's
 *   refund API, store the returned gateway_refund_id, and only commit if the
 *   provider call succeeds.  On provider error, rollback and return 502.
 *
 * Body: { gateway_refund_id? }
 */
export async function approveRefund(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);
  if (user.role !== "admin") return forbidden(res, "Admin only.");

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    // Load the pending refund
    const [refundRows] = await conn.query(
      `SELECT id, status, amount_cents FROM refunds
       WHERE payment_id = ? AND status = 'pending'
       LIMIT 1`,
      [paymentId]
    );
    if (!refundRows.length) {
      return notFound(res, "No pending refund found for this payment.");
    }
    const refund = refundRows[0];

    await conn.beginTransaction();
    txStarted = true;

    // 1) Resolve the refund record
    const now = new Date();
    await conn.query(
      `UPDATE refunds
       SET status = 'approved',
           gateway_refund_id = ?,
           resolved_by_user_id = ?,
           resolved_at = ?,
           updated_at  = ?
       WHERE id = ?`,
      [req.body?.gateway_refund_id ?? null, user.id, now, now, refund.id]
    );

    // 2) Transition payment → 'refunded'
    const transition = await transitionPaymentStatus(conn, paymentId, "refunded", user.id);
    if (!transition.ok) {
      await conn.rollback();
      if (transition.notFound) return notFound(res, "Payment not found.");
      return badRequest(res, `Cannot move payment from '${transition.current}' to 'refunded'.`);
    }

    // 3) Audit event
    await emitBillingEvent(conn, {
      paymentId,
      refundId:    refund.id,
      eventType:   "refund.approved",
      actorUserId: user.id,
      payload:     {
        amount_cents:       refund.amount_cents,
        gateway_refund_id:  req.body?.gateway_refund_id ?? null,
        previous_payment_status: transition.previous,
      },
    });

    await conn.commit();
    txStarted = false;

    return res.json({
      success: true,
      message: "Refund approved. Payment marked as refunded.",
      data: { refundId: refund.id, paymentId, paymentStatus: "refunded" },
    });
  } catch (err) {
    if (txStarted) await conn.rollback().catch(() => {});
    return serverError(res, "approveRefund", err);
  } finally {
    conn.release();
  }
}

// ----------------------------------------------------------------------------
// POST /payment/:paymentId/refund/reject  — admin only
// ----------------------------------------------------------------------------
/**
 * Admin rejects the pending refund.
 * Payment status remains 'paid' — the rejection does NOT affect payment state.
 *
 * Body: { reason? }  (admin's rejection note; stored in billing event payload)
 */
export async function rejectRefund(req, res) {
  const user = getAuthUser(req);
  if (!user) return unauthorized(res);
  if (user.role !== "admin") return forbidden(res, "Admin only.");

  const paymentId = toPositiveInt(req.params?.paymentId);
  if (!paymentId) return badRequest(res, "Invalid paymentId.");

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    const [refundRows] = await conn.query(
      `SELECT id FROM refunds
       WHERE payment_id = ? AND status = 'pending'
       LIMIT 1`,
      [paymentId]
    );
    if (!refundRows.length) {
      return notFound(res, "No pending refund found for this payment.");
    }
    const refundId = refundRows[0].id;

    await conn.beginTransaction();
    txStarted = true;

    const now = new Date();
    await conn.query(
      `UPDATE refunds
       SET status = 'rejected',
           resolved_by_user_id = ?,
           resolved_at = ?,
           updated_at  = ?
       WHERE id = ?`,
      [user.id, now, now, refundId]
    );

    await emitBillingEvent(conn, {
      paymentId,
      refundId,
      eventType:   "refund.rejected",
      actorUserId: user.id,
      payload:     { admin_reason: req.body?.reason ?? null },
    });

    await conn.commit();
    txStarted = false;

    return res.json({
      success: true,
      message: "Refund rejected.",
      data: { refundId, paymentId },
    });
  } catch (err) {
    if (txStarted) await conn.rollback().catch(() => {});
    return serverError(res, "rejectRefund", err);
  } finally {
    conn.release();
  }
}
