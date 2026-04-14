// src/components/payment/PaymentStatusBadge.tsx
// Reusable pill badge for payment and refund status values.
// Bilingual: pass lang="ar" for Arabic labels.
// No external dependencies beyond Tailwind.

import type { PaymentStatus, RefundStatus } from "@/src/services/paymentService";

type AnyStatus = PaymentStatus | RefundStatus;

type Props = {
  status: AnyStatus;
  lang?: "en" | "ar";
  size?: "sm" | "md";
};

const PAYMENT_LABELS: Record<PaymentStatus, { en: string; ar: string }> = {
  pending:  { en: "Pending",  ar: "قيد الانتظار" },
  paid:     { en: "Paid",     ar: "مدفوع"         },
  failed:   { en: "Failed",   ar: "فشل الدفع"     },
  refunded: { en: "Refunded", ar: "مُسترد"        },
};

const REFUND_LABELS: Record<RefundStatus, { en: string; ar: string }> = {
  pending:  { en: "Refund pending",  ar: "استرداد قيد المراجعة" },
  approved: { en: "Refund approved", ar: "تم الاسترداد"          },
  rejected: { en: "Refund rejected", ar: "رُفض الاسترداد"        },
};

const COLOR_MAP: Record<AnyStatus, string> = {
  // payment statuses
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid:     "bg-green-100  text-green-800  border-green-200",
  failed:   "bg-red-100    text-red-800    border-red-200",
  refunded: "bg-blue-100   text-blue-800   border-blue-200",
  // refund statuses (pending reuses yellow above)
  approved: "bg-green-100  text-green-800  border-green-200",
  rejected: "bg-red-100    text-red-800    border-red-200",
};

function getLabel(status: AnyStatus, lang: "en" | "ar"): string {
  if (status in PAYMENT_LABELS) {
    return PAYMENT_LABELS[status as PaymentStatus][lang];
  }
  if (status in REFUND_LABELS) {
    return REFUND_LABELS[status as RefundStatus][lang];
  }
  return status;
}

export default function PaymentStatusBadge({ status, lang = "en", size = "sm" }: Props) {
  const label  = getLabel(status, lang);
  const colors = COLOR_MAP[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const sizeClass = size === "md"
    ? "px-3 py-1 text-sm font-medium"
    : "px-2 py-0.5 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${colors} ${sizeClass}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
