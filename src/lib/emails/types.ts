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
  /** Product name exactly as set in admin, snapshotted on the order. */
  productName: string;
  /** Tier badge - "Basic" / "Premium" / "Custom". Null on pre-snapshot orders. */
  productTier: string | null;
  /**
   * Absolute https URL of the product artwork, or null.
   *
   * Null whenever an absolute https URL cannot be produced - a relative upload
   * path on a local dev origin, for instance. The template must stay complete
   * without it: mail clients block images by default.
   */
  productImageUrl: string | null;
  quantity: number;
  /**
   * The amount actually charged, formatted with the SAME helper the UI uses
   * (src/utils/formatPrice.ts), so the email cannot show a different figure
   * from the checkout page.
   */
  amountPaid: string;
  /** Exactly as submitted on the checkout form - this is what gets printed. */
  proof: {
    name: string;
    designation: string | null;
    company: string | null;
    mobile: string | null;
    email: string | null;
  };
  /**
   * Public URL of the customer's digital profile, when the card has been
   * created. Null at payment time - the card is created when an admin confirms
   * the order - and the template says so rather than showing a dead link.
   */
  profileUrl: string | null;
}

export interface OrderShippedEmailData extends OrderEmailBase {
  courierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
  /** Human-readable window, e.g. "12 - 15 September". Null when not set. */
  expectedDelivery: string | null;
}

export type OrderDeliveredEmailData = OrderEmailBase;
