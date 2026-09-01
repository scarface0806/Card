/**
 * Loads the product a customer is checking out with.
 *
 * SERVER-ONLY. This is the single source of truth for the checkout page and for
 * the order row: name, price, tier, image, description and feature bullets all
 * come from the product record the admin panel writes to, read fresh from the
 * database on every request.
 *
 * WHY THIS FILE EXISTS
 * /create-card used to resolve its product from a hardcoded array of card
 * tiers in src/utils/cardTemplates.ts (now deleted), falling back to
 * `cardTemplates[0]` - "Modern Minimalist, 599" - whenever the slug was not in
 * that array. Every admin-created product hit that fallback, so a 999 rupee
 * card was presented, and charged, at 599.
 *
 * There is no fallback here, on purpose. A missing, inactive or unpriced
 * product returns a typed failure that the caller turns into a redirect. It
 * never substitutes a different product or a different amount.
 */

import prisma from "@/lib/prisma";
import { formatPrice } from "@/utils/formatPrice";

import {
  type CardTier,
  deriveCardColor,
  deriveCardTier,
  deriveFeatureBullets,
  effectivePrice,
  hasDiscount,
  tierLabel,
} from "./presentation";

/** Razorpay rejects anything under 1 rupee, so a 0-priced row is not sellable. */
const MIN_SELLABLE_PRICE = 1;

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
  imageUrl: string | null;
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

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  salePrice: true,
  images: true,
  cardType: true,
  material: true,
  color: true,
  isActive: true,
} as const;

function toSelectedProduct(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  images: string[];
  cardType: string | null;
  material: string | null;
  color: string | null;
}): SelectedProduct {
  const price = effectivePrice(row);
  const tier = deriveCardTier(row);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tier,
    tierLabel: tierLabel(tier),
    price,
    priceFormatted: formatPrice(price),
    listPriceFormatted: hasDiscount(row) ? formatPrice(row.price) : null,
    description: row.description,
    imageUrl: row.images?.[0] || null,
    color: deriveCardColor(row),
    features: deriveFeatureBullets(tier),
  };
}

/**
 * A 24-character hex string. Mongo ObjectIds are the only shape `findUnique`
 * accepts here; anything else would make Prisma throw rather than miss.
 */
function isObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

/**
 * Load the selected product.
 *
 * `productId` is the canonical identifier. `slug` is accepted as a fallback so
 * links that predate this change (`/create-card?template=<slug>`) still resolve
 * to the right product instead of silently landing on a default one.
 */
export async function getSelectedProduct({
  productId,
  slug,
}: {
  productId?: string | null;
  slug?: string | null;
}): Promise<SelectedProductResult> {
  const id = productId?.trim();
  const bySlug = slug?.trim();

  if (!id && !bySlug) {
    return { ok: false, reason: "missing" };
  }

  const row =
    id && isObjectId(id)
      ? await prisma.product.findUnique({
          where: { id },
          select: PRODUCT_SELECT,
        })
      : bySlug
        ? await prisma.product.findUnique({
            where: { slug: bySlug },
            select: PRODUCT_SELECT,
          })
        : null;

  if (!row) {
    return { ok: false, reason: "not-found" };
  }

  if (!row.isActive) {
    return { ok: false, reason: "inactive" };
  }

  if (effectivePrice(row) < MIN_SELLABLE_PRICE) {
    // A 0-priced row is an enquiry-only product. Sending it to checkout would
    // fail at the payment gateway with an opaque error.
    return { ok: false, reason: "not-purchasable" };
  }

  return { ok: true, product: toSelectedProduct(row) };
}

/**
 * The authoritative price for an order, recomputed from the product id at the
 * moment the order is written. Used by POST /api/orders so no price, and no
 * product name, is ever taken from the request body.
 */
export async function getPurchasableProduct(
  productId: string
): Promise<SelectedProductResult> {
  return getSelectedProduct({ productId });
}
