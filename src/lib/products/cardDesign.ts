/**
 * PRODUCT -> CARD DESIGN, in one place.
 *
 * This transform used to live inside src/hooks/useCardDesigns.ts, which is a
 * client hook. The catalogue is now loaded on the server, so both sides need
 * it and neither may own it: if the server and the client derived tier, price
 * or colour differently, the markup React hydrated would not match the markup
 * it rendered.
 *
 * Pure and framework-free on purpose - no "use client", no "server-only", no
 * Prisma import. It takes a plain row shape so the server loader can pass a
 * Prisma result and the client hook can pass a JSON response body, and both
 * get byte-identical output.
 */

import { formatPrice } from "@/utils/formatPrice";
import {
  type CardTier,
  deriveCardColor,
  deriveCardTier,
  effectivePrice,
  hasDiscount,
  tierLabel,
} from "@/lib/products/presentation";

/**
 * The catalogue's view of a product.
 *
 * `id` is the Product id and is what /cards passes to checkout, so the page a
 * customer lands on is unambiguously the product they clicked.
 */
export interface CardDesign {
  id: string;
  name: string;
  slug: string;
  type: CardTier;
  typeLabel: string;
  /** What the customer is charged, formatted. */
  price: string;
  priceValue: number;
  /** List price, only when a discount is active. For struck-through display. */
  listPrice?: string;
  color: string;
  description?: string;
  images: string[];
  /**
   * The card's back face, straight from `Product.backImage`.
   *
   * Optional: a product with no back image simply does not offer the flip.
   */
  backImage?: string;
  cardType?: string;
  material?: string;
}

/**
 * The fields the transform actually reads. Deliberately structural rather than
 * Prisma's `Product`, so a selected subset from the server and a parsed JSON
 * body from the client both satisfy it.
 */
export interface CardDesignSource {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  images?: string[] | null;
  backImage?: string | null;
  cardType?: string | null;
  material?: string | null;
  color?: string | null;
}

export function productToCardDesign(product: CardDesignSource): CardDesign {
  // The presentation helpers were written against Prisma's Product. They read
  // only the fields above, so the cast is narrowing to what they touch rather
  // than asserting anything untrue.
  const source = product as unknown as Parameters<typeof deriveCardTier>[0];

  const tier = deriveCardTier(source);
  const price = effectivePrice(source);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: tier,
    typeLabel: tierLabel(tier),
    price: formatPrice(price),
    priceValue: price,
    listPrice: hasDiscount(source) ? formatPrice(product.price) : undefined,
    color: deriveCardColor(source),
    description: product.description || undefined,
    images: product.images || [],
    backImage: product.backImage || undefined,
    cardType: product.cardType || undefined,
    material: product.material || undefined,
  };
}
