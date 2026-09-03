/**
 * Types and copy for product selection.
 *
 * DELIBERATELY FREE OF ANY PRISMA IMPORT. Client components need the
 * `SelectedProduct` shape and the failure messages, and importing them from
 * the loader in ./selected-product.ts pulled PrismaClient into the browser
 * bundle - which fails at runtime with "PrismaClient is unable to run in this
 * browser environment".
 *
 * Anything a client component needs goes here. Anything that touches the
 * database goes in ./selected-product.ts.
 */

import type { CardTier } from "./presentation";

export interface SelectedProduct {
  id: string;
  name: string;
  slug: string;
  tier: CardTier;
  tierLabel: string;
  /** What the customer is charged, in rupees. Authoritative. */
  price: number;
  /** `price`, formatted through the one shared helper. */
  priceFormatted: string;
  /** List price, only when a discount is active. For struck-through display. */
  listPriceFormatted: string | null;
  description: string | null;
  /** Absolute URL of the artwork the admin uploaded, or null. */
  imageUrl: string | null;
  /** The back of the card, or null when the admin did not upload one. */
  backImageUrl: string | null;
  /** Gradient for the live preview when the product has no photograph. */
  color: string;
  features: string[];
}

export type SelectedProductFailure =
  | "missing"
  | "not-found"
  | "inactive"
  | "not-purchasable";

export type SelectedProductResult =
  | { ok: true; product: SelectedProduct }
  | { ok: false; reason: SelectedProductFailure };

/** Message shown on /cards for each failure. Never mentions a price. */
export const SELECTED_PRODUCT_MESSAGES: Record<SelectedProductFailure, string> = {
  missing: "Choose a card to get started.",
  "not-found": "That card is no longer available. Please pick another one.",
  inactive: "That card is not available right now. Please pick another one.",
  "not-purchasable":
    "That card cannot be ordered online. Talk to our team and we will sort it out.",
};
