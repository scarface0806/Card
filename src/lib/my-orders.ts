/**
 * MY ORDERS - the logged-in customer's own order list.
 *
 * SERVER-ONLY. Called from app/api/my-orders/route.ts and
 * app/api/my-orders/[orderId]/route.ts.
 *
 * DISCLOSURE RULES, following the same discipline as src/lib/track-order.ts:
 *
 *  - Ownership is enforced in the QUERY, not after it. Both lookups below put
 *    `userId` in the `where` clause, so an order belonging to someone else
 *    cannot be loaded and then filtered out in a component - a filtered-in-the-
 *    component row is still fully visible in the network response.
 *  - The projections here are the entire contract. `paymentId` (the Razorpay
 *    reference) and the internal `notes` field are deliberately absent: the
 *    customer has no use for either and they should not travel to a browser.
 *  - A miss and a not-yours both return null, so the endpoint cannot be used
 *    to discover which order ids exist.
 *
 * THIS MODULE IS READ-ONLY. There is no update path here by design - a
 * customer changes their printed details by talking to the team, which is what
 * the "Request a change" WhatsApp button on /my-orders is for.
 */

import prisma from "@/lib/prisma";

/**
 * The stage vocabulary lives in src/lib/order-stages.ts, which imports
 * nothing. It has to: the client components that draw the timeline need
 * ORDER_STAGES at runtime, and importing it from this file would pull the
 * Prisma client into the browser bundle.
 */
import {
  isCancelledStatus,
  stageForStatus,
  type OrderStage,
} from "@/lib/order-stages";

export { ORDER_STAGES, isCancelledStatus, stageForStatus } from "@/lib/order-stages";
export type { OrderStage } from "@/lib/order-stages";

export interface MyOrderSummary {
  id: string;
  orderRef: string;
  placedAt: string;
  /** Product name as sold - a snapshot, not a join. */
  designName: string | null;
  designThumbnailUrl: string | null;
  productTier: string | null;
  amountPaid: number;
  paymentStatus: string;
  status: string;
  stage: OrderStage;
  /** True when cancelled or refunded; the timeline stops rather than advances. */
  cancelled: boolean;
  timestamps: Record<OrderStage, string | null>;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  expectedDeliveryFrom: string | null;
  expectedDeliveryTo: string | null;
  /** Path of the live profile, e.g. "/card/ravi-kumar". Null until a card exists. */
  profilePath: string | null;
}

/** What the customer typed at checkout, shown back to them read-only. */
export interface SubmittedDetails {
  name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  company: string | null;
  website: string | null;
  address: string | null;
}

export interface MyOrderDetail extends MyOrderSummary {
  submitted: SubmittedDetails;
  items: {
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: string | null;
}

/**
 * Columns the customer's own order view may read.
 *
 * Note what is NOT here: `paymentId`, `notes`, `profileData`. The first two are
 * internal, and `profileData` is a raw JSON blob of the whole submitted form -
 * the flat `submitted` fields below are what the detail page shows instead, so
 * there is a named contract rather than an opaque dump.
 */
const SUMMARY_SELECT = {
  id: true,
  orderNumber: true,
  createdAt: true,
  cardType: true,
  productImageUrl: true,
  productTier: true,
  total: true,
  paymentStatus: true,
  status: true,
  courierName: true,
  trackingNumber: true,
  trackingUrl: true,
  expectedDeliveryFrom: true,
  expectedDeliveryTo: true,
  paidAt: true,
  printingAt: true,
  shippedAt: true,
  deliveredAt: true,
  cardId: true,
} as const;

const DETAIL_SELECT = {
  ...SUMMARY_SELECT,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  recipientEmail: true,
  designation: true,
  company: true,
  website: true,
  address: true,
  items: true,
  subtotal: true,
  discount: true,
  shipping: true,
  tax: true,
  paymentMethod: true,
} as const;

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Resolve card ids to their public slugs in one query.
 *
 * Batched deliberately: doing it per order would be an N+1 on the list page.
 */
async function resolveProfilePaths(
  cardIds: string[]
): Promise<Map<string, string>> {
  const valid = cardIds.filter((id) => /^[a-fA-F0-9]{24}$/.test(id));
  if (valid.length === 0) return new Map();

  const cards = await prisma.card.findMany({
    where: { id: { in: valid } },
    select: { id: true, slug: true, isActive: true },
  });

  return new Map(
    cards
      // An inactive card's URL would 404-ish for the customer, so it is not
      // offered as a "live profile" link.
      .filter((card) => card.isActive && card.slug)
      .map((card) => [card.id, `/card/${card.slug}`])
  );
}

type SummaryRow = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  cardType: string | null;
  productImageUrl: string | null;
  productTier: string | null;
  total: number;
  paymentStatus: string;
  status: string;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  expectedDeliveryFrom: Date | null;
  expectedDeliveryTo: Date | null;
  paidAt: Date | null;
  printingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cardId: string | null;
};

function toSummary(row: SummaryRow, profilePath: string | null): MyOrderSummary {
  return {
    id: row.id,
    orderRef: row.orderNumber,
    placedAt: row.createdAt.toISOString(),
    designName: row.cardType,
    designThumbnailUrl: row.productImageUrl,
    productTier: row.productTier,
    amountPaid: row.total,
    paymentStatus: String(row.paymentStatus),
    status: String(row.status),
    stage: stageForStatus(String(row.status)),
    cancelled: isCancelledStatus(String(row.status)),
    timestamps: {
      placed: iso(row.createdAt),
      // There is no `confirmedAt` column. Payment is what confirms an order and
      // locks the design, and CONFIRMED is the status the payment-success path
      // sets, so paidAt is the honest stamp for this stage.
      confirmed: iso(row.paidAt),
      encoded: iso(row.printingAt),
      shipped: iso(row.shippedAt),
      delivered: iso(row.deliveredAt),
    },
    courierName: row.courierName,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    expectedDeliveryFrom: iso(row.expectedDeliveryFrom),
    expectedDeliveryTo: iso(row.expectedDeliveryTo),
    profilePath,
  };
}

/**
 * Every order belonging to this user, newest first.
 *
 * `userId` is in the where clause, so this can only ever return the caller's
 * own rows.
 */
export async function listMyOrders(userId: string): Promise<MyOrderSummary[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: SUMMARY_SELECT,
  });

  const profilePaths = await resolveProfilePaths(
    rows.map((row) => row.cardId).filter((id): id is string => Boolean(id))
  );

  return rows.map((row) =>
    toSummary(row, row.cardId ? profilePaths.get(row.cardId) ?? null : null)
  );
}

/**
 * One order, but only if it belongs to this user.
 *
 * The ownership check is part of the query. A findUnique on the id followed by
 * an `if (order.userId !== userId)` would work too, but this shape makes it
 * impossible to forget the second half.
 */
export async function getMyOrder(
  userId: string,
  orderId: string
): Promise<MyOrderDetail | null> {
  if (!/^[a-fA-F0-9]{24}$/.test(orderId)) return null;

  const row = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: DETAIL_SELECT,
  });

  if (!row) return null;

  const profilePaths = await resolveProfilePaths(row.cardId ? [row.cardId] : []);
  const summary = toSummary(
    row,
    row.cardId ? profilePaths.get(row.cardId) ?? null : null
  );

  return {
    ...summary,
    submitted: {
      name: row.guestName,
      // recipientEmail is the address the customer typed at checkout and the
      // one every order email goes to. Shown in preference to guestEmail so
      // what they see matches where the mail actually went.
      email: row.recipientEmail || row.guestEmail,
      phone: row.guestPhone,
      designation: row.designation,
      company: row.company,
      website: row.website,
      address: row.address,
    },
    items: (row.items || []).map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    tax: row.tax,
    total: row.total,
    paymentMethod: row.paymentMethod,
  };
}
