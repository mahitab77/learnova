// src/routes/payment.routes.js
// ============================================================================
// Payment + Refund routes
// Mounted at: /payment  (see app.js)
//
// Route map:
//
//   POST /payment/initiate                    parent initiates a payment
//   GET  /payment/my                          list caller's own payments
//   GET  /payment/:paymentId                  get one payment (own or admin)
//   POST /payment/:paymentId/confirm          STUB → mark paid
//   POST /payment/:paymentId/fail             STUB → mark failed
//
//   POST /payment/:paymentId/refund/request   parent requests a refund
//   GET  /payment/:paymentId/refund           get refund status
//   POST /payment/:paymentId/refund/approve   admin approves
//   POST /payment/:paymentId/refund/reject    admin rejects
//
// Auth: all routes require an authenticated session (requireUser applied via
//       router.use below; role checks are done inside each controller function
//       as a second layer of defence).
//
// NOTE: When wiring a real gateway, the webhook endpoints (confirm / fail)
//       must bypass session auth and instead use gateway signature validation.
//       Extract them into a separate webhooks.routes.js at that point.
// ============================================================================

import express from "express";

import { requireUser } from "../middlewares/auth.js";

import {
  initiatePayment,
  listMyPayments,
  getPayment,
  getPaymentBySession,
  confirmPayment,
  failPayment,
} from "../controllers/payment.controller.js";

import {
  requestRefund,
  getRefund,
  approveRefund,
  rejectRefund,
} from "../controllers/refund.controller.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Auth gate — all payment and refund routes require an authenticated session.
// Controller-level ownership/role checks remain as a second layer of defence.
// NOTE: When a real payment gateway is wired, the webhook callback routes
// (confirm / fail) must be extracted to webhooks.routes.js and exempted from
// session auth (gateway callbacks carry a signature, not a session cookie).
// ---------------------------------------------------------------------------
router.use(requireUser);

// ---------------------------------------------------------------------------
// Payment routes
// ---------------------------------------------------------------------------

// IMPORTANT: fixed-path routes (/my, /session/:id) must be declared before
// /:paymentId so Express does not treat them as paymentId parameters.
router.get("/my", listMyPayments);

// Session-centric payment read model (payment + refund + recovery for one session)
router.get("/session/:sessionId", getPaymentBySession);

router.post("/initiate", initiatePayment);
router.get("/:paymentId", getPayment);

// Gateway stubs — admin only until a real provider is integrated
router.post("/:paymentId/confirm", confirmPayment);
router.post("/:paymentId/fail",    failPayment);

// ---------------------------------------------------------------------------
// Refund routes (scoped under a payment)
// ---------------------------------------------------------------------------

// IMPORTANT: /refund/request and /refund/approve must be declared before
// /refund so they are not shadowed by the GET /refund handler.
router.post("/:paymentId/refund/request", requestRefund);
router.post("/:paymentId/refund/approve", approveRefund);
router.post("/:paymentId/refund/reject",  rejectRefund);
router.get ("/:paymentId/refund",         getRefund);

export default router;
