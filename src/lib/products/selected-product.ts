/**
 * Loads the product a customer is checking out with.
 *
 * SERVER-ONLY - this module imports Prisma. A client component that imports a
 * VALUE from here pulls PrismaClient into the browser bundle and the page dies
 * with "PrismaClient is unable to run in this browser environment". Client
 * components must import the types and the failure messages from
 * ./selection.ts instead, which is deliberately Prisma-free.
 *
 * This is the single source of truth for the checkout page and for the order
 * row: name, price, tier, image, description and feature bullets all come from
 * the product record the admin panel writes to, read fresh on every request.
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
  deriveCardColor,
  deriveCardTier,
  deriveFeatureBullets,
  effectivePrice,
  hasDiscount,
  tierLabel,
} from "./presentation";
import type { SelectedProduct, SelectedProductResult } from "./selection";

// Re-exported so server-side callers can keep importing everything from one
// place. Client components must import these from ./selection directly.
export {
  SELECTED_PRODUCT_MESSAGES,
  type SelectedProduct,
  type SelectedProductFailure,
  type SelectedProductResult,
} from "./selection";

/** Razorpay rejects anything under 1 rupee, so a 0-priced row is not sellable. */
const MIN_SELLABLE_PRICE = 1;

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
