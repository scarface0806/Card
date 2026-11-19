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
  designFeeFor,
  effectivePrice,
  hasDiscount,
  orderTotalFor,
  tierLabel,
} from "@/lib/products/presentation";
import {
  normalizeOrientation,
  type CardOrientation,
} from "@/lib/products/orientation";

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
  /**
   * What the customer is charged, formatted. For a Customised Card this is the
   * card plus the design charge - see orderTotalFor.
   */
  price: string;
  priceValue: number;
  /** "Customised Card": the customer uploads their own front and back artwork. */
  isCustomDesign: boolean;
  /** The card alone, formatted - the first half of the custom-design breakdown. */
  cardPrice: string;
  /** Design charge, formatted. Only meaningful when isCustomDesign. */
  designFee: string;
  designFeeValue: number;
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
  /** Card shape. Never undefined on a CardDesign - null in the database is
   *  normalised to "horizontal" here so no consumer has to handle absence. */
  orientation: CardOrientation;
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
  orientation?: string | null;
  isCustomDesign?: boolean | null;
  designFee?: number | null;
}

export function productToCardDesign(product: CardDesignSource): CardDesign {
  // The presentation helpers were written against Prisma's Product. They read
  // only the fields above, so the cast is narrowing to what they touch rather
  // than asserting anything untrue.
  const source = product as unknown as Parameters<typeof deriveCardTier>[0];

  const tier = deriveCardTier(source);
  const cardPrice = effectivePrice(source);
  const designFee = designFeeFor(source);
  const price = orderTotalFor(source);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: tier,
    typeLabel: tierLabel(tier),
    price: formatPrice(price),
    priceValue: price,
    isCustomDesign: product.isCustomDesign === true,
    cardPrice: formatPrice(cardPrice),
    designFee: formatPrice(designFee),
    designFeeValue: designFee,
    // Same basis as `price`: full list price plus the (never discounted) fee.
    listPrice: hasDiscount(source) ? formatPrice(product.price + designFee) : undefined,
    color: deriveCardColor(source),
    description: product.description || undefined,
    images: product.images || [],
    backImage: product.backImage || undefined,
    cardType: product.cardType || undefined,
    material: product.material || undefined,
    orientation: normalizeOrientation(product.orientation),
  };
}
