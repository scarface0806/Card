/**
 * Shared types for the transactional order emails.
 *
 * `type` and `status` are stored as plain strings on EmailLog rather than
 * Prisma enums so the log can be read and repaired with a raw Mongo shell if
 * it ever has to be, and so adding a fourth email type never needs a schema
 * migration. These constants are the only sanctioned values.
 */

export const EMAIL_TYPES = {
  CONFIRMATION: "confirmation",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
} as const;

export type EmailType = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES];

/** Every email type, in the order a customer sees them. */
export const EMAIL_TYPE_ORDER: readonly EmailType[] = [
  EMAIL_TYPES.CONFIRMATION,
  EMAIL_TYPES.SHIPPED,
  EMAIL_TYPES.DELIVERED,
];

export const EMAIL_LOG_STATUSES = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type EmailLogStatus =
  (typeof EMAIL_LOG_STATUSES)[keyof typeof EMAIL_LOG_STATUSES];

export function isEmailType(value: unknown): value is EmailType {
  return (
    typeof value === "string" &&
    (EMAIL_TYPE_ORDER as readonly string[]).includes(value)
  );
}

export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  confirmation: "Order confirmation",
  shipped: "Shipped",
  delivered: "Delivered",
};

/**
 * Everything the templates are allowed to know about an order.
 *
 * Deliberately narrow: the shipping address, the payment id and the customer's
 * account details are not in here, so no template can accidentally print them.
 */
export interface OrderEmailBase {
  /** Public order reference - what the customer tracks with. */
  orderRef: string;
  /** Absolute URL of the public tracking page, prefilled with the reference. */
  trackUrl: string;
}

export interface OrderConfirmationEmailData extends OrderEmailBase {
  templateName: string;
  quantity: number;
  /** Already formatted for display, e.g. "Rs 599.00 INR". */
  amountPaid: string;
  /** Exactly as submitted on the checkout form - this is what gets printed. */
  proof: {
    name: string;
    designation: string | null;
    company: string | null;
  };
}

export interface OrderShippedEmailData extends OrderEmailBase {
  courierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
  /** Human-readable window, e.g. "12 - 15 September". Null when not set. */
  expectedDelivery: string | null;
}

export type OrderDeliveredEmailData = OrderEmailBase;
