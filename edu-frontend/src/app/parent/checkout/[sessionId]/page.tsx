"use client";
// src/app/parent/checkout/[sessionId]/page.tsx
// ============================================================================
// Booking Confirmation / Checkout Entry Point
// ----------------------------------------------------------------------------
// This page is the handoff between session booking and payment:
//   1. Checks if a payment already exists for this session.
//   2. If not, shows a confirmation screen and "Proceed to payment" button.
//   3. Calls POST /payment/initiate, then shows the resulting payment status.
//   4. If payment exists, shows current status + optional refund flow.
//
// TODO(gateway): When a real provider is integrated, replace the
//   "Pay now (stub)" button action with a redirect to the provider's
//   hosted checkout URL (returned from a new POST /payment/checkout-url
//   endpoint).  The status poll / webhook will then confirm the payment
//   and the parent lands back here.
// ============================================================================

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";

import { useSession } from "@/src/hooks/useSession";
import paymentService, {
  type Payment,
  type Refund,
  type PaymentStatus,
  type RecoveryGuidance,
} from "@/src/services/paymentService";
import PaymentStatusBadge from "@/src/components/payment/PaymentStatusBadge";

// ---------------------------------------------------------------------------
// Localisation
// ---------------------------------------------------------------------------
const T = {
  en: {
    title:              "Session payment status",
    sessionLabel:       "Session ID",
    statusLabel:        "Payment status",
    noPayment:          "No payment record found for this session.",
    offlineNotice:      "Payment for this platform is arranged offline. Your coordinator will confirm the payment details directly — no action is required here.",
    refundBtn:          "Request a refund",
    requesting:         "Requesting...",
    refundStatus:       "Refund status",
    back:               "Back to dashboard",
    notAuthed:          "Please log in to continue.",
    offlinePosture:     "Payments are handled offline for this platform. Contact your coordinator if you have questions about your payment status.",
    alreadyPaid:        "This session has already been paid.",
    refundPending:      "Your refund request is under review.",
    recoveryLabel:      "What to do next",
    statusPaid:         "Payment confirmed",
    statusFailed:       "Payment failed — please try again",
    statusRefunded:     "Refund processed",
    statusPending:      "Awaiting payment confirmation",
  },
  ar: {
    title:              "حالة دفع الحصة",
    sessionLabel:       "رقم الحصة",
    statusLabel:        "حالة الدفع",
    noPayment:          "لا يوجد سجل دفع لهذه الحصة.",
    offlineNotice:      "يتم تسوية الدفع يدوياً لهذه المنصة. سيتواصل معك المنسق لتأكيد تفاصيل الدفع مباشرةً — لا يلزمك اتخاذ أي إجراء هنا.",
    refundBtn:          "طلب استرداد",
    requesting:         "جارٍ الطلب...",
    refundStatus:       "حالة الاسترداد",
    back:               "العودة للوحة التحكم",
    notAuthed:          "يرجى تسجيل الدخول للمتابعة.",
    offlinePosture:     "تتم إدارة المدفوعات يدوياً في هذه المنصة. تواصل مع المنسق إذا كان لديك أسئلة حول حالة دفعك.",
    alreadyPaid:        "تمت عملية الدفع لهذه الحصة.",
    refundPending:      "طلب الاسترداد قيد المراجعة.",
    recoveryLabel:      "الإجراء المطلوب",
    statusPaid:         "تم تأكيد الدفع",
    statusFailed:       "فشلت عملية الدفع — يرجى المحاولة مرة أخرى",
    statusRefunded:     "تمت معالجة الاسترداد",
    statusPending:      "في انتظار تأكيد الدفع",
  },
} as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function CheckoutPageContent() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const lang         = searchParams.get("lang") === "ar" ? "ar" : "en";
  const dir          = lang === "ar" ? "rtl" : "ltr";
  const t            = T[lang];

  const sessionId = Number(params?.sessionId);
  // Validate sessionId at component level so the effect body never needs to
  // call setState in the synchronous guard path (satisfies react-hooks/set-state-in-effect).
  const validSessionId = Number.isFinite(sessionId) && sessionId > 0;

  const { loading: sessionLoading, authenticated } = useSession();

  const [payment,       setPayment]       = useState<Payment | null>(null);
  const [refund,        setRefund]        = useState<Refund  | null>(null);
  const [recovery,      setRecovery]      = useState<RecoveryGuidance | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  // Incrementing this triggers a data re-fetch after mutations.
  const [refreshKey, setRefreshKey] = useState(0);

  // -------------------------------------------------------------------------
  // Load session payment state from the authoritative single endpoint.
  // Returns payment + most-recent refund + recovery guidance in one call.
  // All setState calls live inside the async run() so the effect body itself
  // never calls setState synchronously (satisfies react-hooks/set-state-in-effect).
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (sessionLoading || !authenticated || !validSessionId) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const result = await paymentService.getBySession(sessionId);
      if (cancelled) return;

      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      setPayment(result.data.payment);
      setRefund(result.data.refund);
      setRecovery(result.data.recovery);
      if (!cancelled) setLoading(false);
    }

    void run();
    return () => { cancelled = true; };
  }, [sessionLoading, authenticated, validSessionId, sessionId, refreshKey]);

  // -------------------------------------------------------------------------
  // Request refund
  // -------------------------------------------------------------------------
  async function handleRefundRequest() {
    if (!payment) return;
    setActionLoading(true);
    setError(null);
    const result = await paymentService.requestRefund(payment.id, {
      reason: "Requested by parent via checkout page",
    });
    if (!result.success) {
      setError(result.message);
    } else {
      setRefreshKey((k) => k + 1);
    }
    setActionLoading(false);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir={dir}>
        <RefreshCw className="h-6 w-6 animate-spin text-[#08ABD3]" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center" dir={dir}>
        <p className="text-[#111624]/70">{t.notAuthed}</p>
        <Link href={`/auth/login?lang=${lang}`} className="mt-4 inline-block text-[#08ABD3] underline">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]" dir={dir}>
      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={`/parent/dashboard?lang=${lang}`}
            className="inline-flex items-center gap-1 text-sm text-[#111624]/60 hover:text-[#111624]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </div>

        <div className="rounded-2xl border border-[#111624]/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#111624]">{t.title}</h1>

          {/* Session info */}
          <div className="mt-4 space-y-2 text-sm text-[#111624]/70">
            <div className="flex justify-between">
              <span>{t.sessionLabel}</span>
              <span className="font-mono font-semibold text-[#111624]">{sessionId}</span>
            </div>
          </div>

          <hr className="my-4 border-[#111624]/10" />

          {/* Offline/manual payment notice */}
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-800">
            {t.offlinePosture}
          </p>

          {/* Payment status block */}
          <div className="mt-5">
            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            {!payment ? (
              // No payment record yet — show server-provided recovery guidance
              <div className="space-y-3">
                <p className="text-sm text-[#111624]/60">{t.noPayment}</p>
                {recovery && (
                  <p className="rounded-lg bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
                    {recovery.message}
                  </p>
                )}
              </div>
            ) : (
              // Payment record exists
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#111624]/70">{t.statusLabel}</span>
                  <PaymentStatusBadge status={payment.status} lang={lang} size="md" />
                </div>

                <PaymentStatusIllustration status={payment.status} t={t} />

                {/* Actionable recovery guidance (shown for failed / rejected-refund states) */}
                {recovery?.actionable && (
                  <div className="rounded-lg bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-900">{t.recoveryLabel}</p>
                    <p className="mt-1 text-xs text-amber-800">{recovery.message}</p>
                  </div>
                )}

                {/* Show refund option when paid and no active/approved refund */}
                {payment.status === "paid" &&
                  (!refund || refund.status === "rejected") && (
                  <button
                    onClick={() => void handleRefundRequest()}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-[#111624]/20 px-6 py-2.5 text-sm
                               font-semibold text-[#111624] transition-colors
                               hover:bg-[#111624]/5 disabled:opacity-60"
                  >
                    {actionLoading ? t.requesting : t.refundBtn}
                  </button>
                )}

                {/* Refund status */}
                {refund && (
                  <div className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-4 py-3">
                    <span className="text-sm text-[#111624]/70">{t.refundStatus}</span>
                    <PaymentStatusBadge status={refund.status} lang={lang} size="md" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutPageFallback() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageFallback />}>
      <CheckoutPageContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Small illustrative icon per payment status
// ---------------------------------------------------------------------------
function PaymentStatusIllustration({
  status,
  t,
}: {
  status: PaymentStatus;
  t: { statusPaid: string; statusFailed: string; statusRefunded: string; statusPending: string };
}) {
  if (status === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span className="text-sm text-green-800">{t.statusPaid}</span>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3">
        <XCircle className="h-5 w-5 text-red-600" />
        <span className="text-sm text-red-800">{t.statusFailed}</span>
      </div>
    );
  }
  if (status === "refunded") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3">
        <RefreshCw className="h-5 w-5 text-blue-600" />
        <span className="text-sm text-blue-800">{t.statusRefunded}</span>
      </div>
    );
  }
  // pending
  return (
    <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3">
      <Clock className="h-5 w-5 text-yellow-600" />
      <span className="text-sm text-yellow-800">{t.statusPending}</span>
    </div>
  );
}
