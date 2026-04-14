// src/services/paymentService.ts
// ============================================================================
// Payment Service — typed API client for the payment/refund module
// ----------------------------------------------------------------------------
// Mirrors the backend contract in src/routes/payment.routes.js.
// Uses the shared apiFetch helper (credentials: "include" + CSRF token).
// ============================================================================

import { apiFetch, API_BASE } from "@/src/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type RefundStatus  = "pending" | "approved" | "rejected";

export type Payment = {
  id: number;
  session_id: number | null;
  payer_user_id: number;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  gateway: string | null;
  gateway_payment_id: string | null;
  paid_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (present in listMyPayments and getPaymentBySession)
  starts_at?: string | null;
  ends_at?: string | null;
  subject_name_en?: string | null;
  subject_name_ar?: string | null;
  // Inline refund summary (present in listMyPayments only)
  refund_id?: number | null;
  refund_status?: RefundStatus | null;
};

export type Refund = {
  id: number;
  payment_id: number;
  amount_cents: number;
  reason: string | null;
  status: RefundStatus;
  gateway_refund_id: string | null;
  resolved_by_user_id: number | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InitiatePaymentInput = {
  session_id: number;
  currency?: string;
};

export type RequestRefundInput = {
  amount_cents?: number;
  reason?: string;
};

/** Recovery guidance returned by GET /payment/session/:sessionId */
export type RecoveryGuidance = {
  /** Machine-readable state key (no_payment | payment_pending | payment_failed |
   *  paid | refund_pending | refund_approved | refund_rejected | refunded | unknown) */
  state:      string;
  /** Human-readable next-step message suitable for direct display */
  message:    string;
  /** true when the user has something actionable to do (e.g. contact coordinator) */
  actionable: boolean;
};

/** Combined session-centric payment read model */
export type PaymentSessionView = {
  payment:  Payment | null;
  refund:   Refund  | null;
  recovery: RecoveryGuidance;
};

// ---------------------------------------------------------------------------
// Typed response wrappers
// ---------------------------------------------------------------------------

type OkResponse<T>     = { success: true;  data: T;       message?: string };
type ErrorResponse     = { success: false; message: string; code?: string };
type ApiResponse<T>    = OkResponse<T> | ErrorResponse;

// ---------------------------------------------------------------------------
// Helper — normalise the raw fetch result into ApiResponse<T>
// Needed because apiFetch throws on non-2xx, so we catch and normalise.
// ---------------------------------------------------------------------------
async function call<T>(fn: () => Promise<unknown>): Promise<ApiResponse<T>> {
  try {
    const raw = await fn();
    // apiFetch already returns parsed JSON; just cast it
    return raw as ApiResponse<T>;
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Unknown error";
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code: unknown }).code)
        : undefined;
    return { success: false, message, code };
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const paymentService = {
  // -------------------------------------------------------------------------
  // GET /payment/session/:sessionId
  // Session-centric read model: payment + refund + recovery guidance.
  // Use this instead of listMine() + client-side filter for per-session views.
  // -------------------------------------------------------------------------
  getBySession(sessionId: number) {
    return call<PaymentSessionView>(() =>
      apiFetch(`${API_BASE}/payment/session/${encodeURIComponent(String(sessionId))}`)
    );
  },

  // -------------------------------------------------------------------------
  // POST /payment/initiate
  // -------------------------------------------------------------------------
  initiate(input: InitiatePaymentInput) {
    return call<{ paymentId: number; status: PaymentStatus }>(() =>
      apiFetch(`${API_BASE}/payment/initiate`, {
        method: "POST",
        json: input as unknown as import("@/src/lib/api").JsonValue,
      })
    );
  },

  // -------------------------------------------------------------------------
  // GET /payment/my?limit=N
  // limit defaults to 50 on the server; max 100.
  // -------------------------------------------------------------------------
  listMine(limit?: number) {
    const qs = limit != null ? `?limit=${encodeURIComponent(String(Math.trunc(limit)))}` : "";
    return call<Payment[]>(() =>
      apiFetch(`${API_BASE}/payment/my${qs}`)
    );
  },

  // -------------------------------------------------------------------------
  // GET /payment/:paymentId
  // -------------------------------------------------------------------------
  get(paymentId: number) {
    return call<Payment>(() =>
      apiFetch(`${API_BASE}/payment/${encodeURIComponent(String(paymentId))}`)
    );
  },

  // -------------------------------------------------------------------------
  // POST /payment/:paymentId/refund/request
  // -------------------------------------------------------------------------
  requestRefund(paymentId: number, input: RequestRefundInput = {}) {
    return call<{ refundId: number; status: RefundStatus }>(() =>
      apiFetch(
        `${API_BASE}/payment/${encodeURIComponent(String(paymentId))}/refund/request`,
        {
          method: "POST",
          json: input as unknown as import("@/src/lib/api").JsonValue,
        }
      )
    );
  },

  // -------------------------------------------------------------------------
  // GET /payment/:paymentId/refund
  // -------------------------------------------------------------------------
  getRefund(paymentId: number) {
    return call<Refund>(() =>
      apiFetch(`${API_BASE}/payment/${encodeURIComponent(String(paymentId))}/refund`)
    );
  },
};

export default paymentService;
