/**
 * Public order tracking lookup.
 *
 * SERVER-ONLY. Called from app/api/track-order/route.ts.
 *
 * DISCLOSURE RULES - these are the point of this file:
 *
 * - The reference alone proves nothing. The reference AND the mobile number
 *   must match the same order row before anything at all comes back.
 * - The projection below is the entire contract. There is no address, no
 *   payment field, no email address and no profile data in it. The whole order
 *   row is never loaded and filtered afterwards, because a filtered-in-the-
 *   component row is still fully visible in the network response.
 * - The mobile number is read only to compare against what the caller typed
 *   and is stripped before returning.
 * - Every failure - wrong reference, wrong mobile, reference that never
 *   existed - returns exactly the same `null`. The caller must not turn these
 *   into different messages, or the endpoint becomes a reference oracle.
 */

import prisma from "@/lib/prisma";

/** The one message the public endpoint is allowed to give for any failure. */
export const TRACK_ORDER_FAILURE_MESSAGE =
  "We couldn't find an order matching those details.";

export type TrackingStage = "placed" | "printing" | "shipped" | "delivered";

export const TRACKING_STAGES: readonly TrackingStage[] = [
  "placed",
  "printing",
  "shipped",
  "delivered",
];

export interface TrackedOrder {
  orderRef: string;
  stage: TrackingStage;
  /** True when the order was cancelled or refunded; the timeline stops. */
  cancelled: boolean;
  timestamps: Record<TrackingStage, string | null>;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  expectedDeliveryFrom: string | null;
  expectedDeliveryTo: string | null;
}

/**
 * Uppercase, trim, and drop whitespace that survived a copy-paste out of the
 * confirmation email.
 */
export function normalizeOrderRef(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/**
 * Reduce a typed mobile number to its last 10 digits. Dropping every
 * non-digit removes spaces, dashes, brackets and the `+`, and taking the last
 * 10 then discards a 91 / 0091 / 0 prefix on either side of the comparison.
 * Returns null when there are not 10 digits to compare.
 */
export function normalizeMobileLast10(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/**
 * Columns the public endpoint may read. `guestPhone` and `user.phone` are here
 * only so the typed number can be checked; neither is returned.
 */
export const TRACKING_SELECT = {
  orderNumber: true,
  status: true,
  createdAt: true,
  printingAt: true,
  shippedAt: true,
  deliveredAt: true,
  courierName: true,
  trackingNumber: true,
  trackingUrl: true,
  expectedDeliveryFrom: true,
  expectedDeliveryTo: true,
  guestPhone: true,
  user: { select: { phone: true } },
} as const;

function stageForStatus(status: string): TrackingStage {
  const normalized = status.toUpperCase();
  if (normalized === "DELIVERED") return "delivered";
  if (normalized === "SHIPPED") return "shipped";
  if (normalized === "PROCESSING") return "printing";
  // PENDING, CONFIRMED, CANCELLED and REFUNDED all sit at "placed" - a
  // cancelled order never reached printing, and `cancelled` carries that.
  return "placed";
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Look up an order for the public tracking page. Returns null for every kind
 * of miss, on purpose.
 */
export async function lookupOrderForTracking(
  refInput: string,
  mobileInput: string
): Promise<TrackedOrder | null> {
  const orderRef = normalizeOrderRef(refInput);
  const mobile = normalizeMobileLast10(mobileInput);

  if (!orderRef || !mobile) return null;

  const order = await prisma.order.findUnique({
    where: { orderNumber: orderRef },
    select: TRACKING_SELECT,
  });

  if (!order) return null;

  // The number given at checkout is the one that unlocks the order. The
  // account phone is accepted too, because it is a phone number recorded
  // against this same order row and a logged-in customer may only know that
  // one. Nothing else is accepted.
  const candidates = [order.guestPhone, order.user?.phone]
    .map((value) => (value ? normalizeMobileLast10(value) : null))
    .filter((value): value is string => value !== null);

  if (!candidates.includes(mobile)) return null;

  const status = String(order.status);
  const cancelled = ["CANCELLED", "REFUNDED"].includes(status.toUpperCase());

  return {
    orderRef: order.orderNumber,
    stage: stageForStatus(status),
    cancelled,
    timestamps: {
      placed: iso(order.createdAt),
      printing: iso(order.printingAt),
      shipped: iso(order.shippedAt),
      delivered: iso(order.deliveredAt),
    },
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    expectedDeliveryFrom: iso(order.expectedDeliveryFrom),
    expectedDeliveryTo: iso(order.expectedDeliveryTo),
  };
}
