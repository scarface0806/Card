/**
 * ORDER STAGES - the customer-facing order lifecycle.
 *
 * DELIBERATELY FREE OF ANY SERVER IMPORT. This module is used by both the
 * route handlers and the client components that render the timeline, so it
 * must not reach for prisma, node:crypto or process.env. src/lib/my-orders.ts
 * is the server half and imports from here; pulling these values out of that
 * file would drag the Prisma client into the browser bundle.
 *
 * These five labels are the vocabulary the business uses with customers, which
 * is not the OrderStatus enum: "Chip Encoded" is what PROCESSING means in
 * production terms. stageForStatus() below is the single place the two
 * vocabularies meet.
 */

export type OrderStage =
  | "placed"
  | "confirmed"
  | "encoded"
  | "shipped"
  | "delivered";

export const ORDER_STAGES: readonly {
  key: OrderStage;
  label: string;
  blurb: string;
}[] = [
  { key: "placed", label: "Order Placed", blurb: "We have your order" },
  {
    key: "confirmed",
    label: "Design Confirmed",
    blurb: "Payment received, details locked",
  },
  { key: "encoded", label: "Chip Encoded", blurb: "Printed and programmed" },
  { key: "shipped", label: "Shipped", blurb: "On its way to you" },
  { key: "delivered", label: "Delivered", blurb: "Tap and go" },
];

/**
 * Map an OrderStatus to the customer-facing stage.
 *
 * PENDING, CANCELLED and REFUNDED all sit at "placed": none of them ever
 * reached production, and the cancelled flag carries that fact separately
 * rather than being smuggled into the stage. Mirrors stageForStatus in
 * src/lib/track-order.ts.
 */
export function stageForStatus(status: string): OrderStage {
  const normalized = status.toUpperCase();
  if (normalized === "DELIVERED") return "delivered";
  if (normalized === "SHIPPED") return "shipped";
  if (normalized === "PROCESSING") return "encoded";
  if (normalized === "CONFIRMED") return "confirmed";
  return "placed";
}

export function isCancelledStatus(status: string): boolean {
  return ["CANCELLED", "REFUNDED"].includes(status.toUpperCase());
}

/** Index of a stage in ORDER_STAGES, or -1. Drives the "current" highlight. */
export function stageIndex(stage: OrderStage): number {
  return ORDER_STAGES.findIndex((s) => s.key === stage);
}
