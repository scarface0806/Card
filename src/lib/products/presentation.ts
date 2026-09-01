/**
 * Presentation rules shared by every surface that shows a product.
 *
 * These are pure functions with no Prisma import, so /cards (client) and
 * /create-card (server) derive the tier badge, the finish colour and the
 * feature bullets from the SAME code. They used to be private to
 * useCardDesigns, which is how the catalogue and the checkout page ended up
 * able to disagree about what a product was.
 *
 * NOTHING HERE INVENTS A PRICE. Every number comes from the product row that
 * is passed in. There is deliberately no default, no fallback tier price and
 * no hardcoded plans list - a missing product is an error for the caller to
 * handle, not something to paper over with 599.
 */

export type CardTier = "basic" | "premium" | "custom";

/** The product fields these rules read. Satisfied by a Prisma Product row. */
export interface ProductPresentationInput {
  price: number;
  salePrice?: number | null;
  cardType?: string | null;
  color?: string | null;
  material?: string | null;
}

/** Price at or above which an unlabelled product reads as premium. */
const PREMIUM_PRICE_THRESHOLD = 700;

const COLOR_MAP: Record<string, string> = {
  standard: "linear-gradient(135deg, #e0e0e0 0%, #9e9e9e 100%)",
  premium: "linear-gradient(135deg, #7c4dff 0%, #18ffff 100%)",
  metal: "linear-gradient(135deg, #424242 0%, #212121 100%)",
  gold: "linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%)",
  blue: "linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)",
  black: "linear-gradient(135deg, #424242 0%, #212121 100%)",
  custom: "linear-gradient(135deg, #0f2e25 0%, #14532d 100%)",
};

/**
 * What the customer is actually charged: the sale price when there is a real
 * discount, otherwise the list price.
 *
 * This is the ONLY definition of "the price" in the codebase. The catalogue,
 * the checkout summary, the payment step and the order row all go through it,
 * so the number on /cards is the number that gets charged.
 */
export function effectivePrice(product: ProductPresentationInput): number {
  const { price, salePrice } = product;
  if (typeof salePrice === "number" && salePrice > 0 && salePrice < price) {
    return salePrice;
  }
  return price;
}

/** True when there is a discount worth showing struck through. */
export function hasDiscount(product: ProductPresentationInput): boolean {
  return effectivePrice(product) < product.price;
}

export function deriveCardTier(product: ProductPresentationInput): CardTier {
  const cardType = product.cardType?.toLowerCase() || "";

  if (cardType === "custom") return "custom";
  if (
    cardType === "premium" ||
    cardType === "metal" ||
    product.price >= PREMIUM_PRICE_THRESHOLD
  ) {
    return "premium";
  }
  return "basic";
}

/** Gradient used to draw the card when a product has no photograph. */
export function deriveCardColor(product: ProductPresentationInput): string {
  const byColor = product.color?.toLowerCase();
  if (byColor && COLOR_MAP[byColor]) return COLOR_MAP[byColor];

  const byCardType = product.cardType?.toLowerCase();
  if (byCardType && COLOR_MAP[byCardType]) return COLOR_MAP[byCardType];

  return COLOR_MAP.standard;
}

/**
 * What every card includes, regardless of tier. Shown on the checkout rail and
 * in the catalogue spec block, so the two cannot drift.
 */
export const CARD_FEATURES: readonly string[] = [
  "Free digital profile, hosted forever",
  "NFC chip encoded and ready to tap",
  "QR code for phones without NFC",
  "Edit your details any time",
] as const;

export function deriveFeatureBullets(tier: CardTier): string[] {
  if (tier === "custom") {
    return [
      ...CARD_FEATURES,
      "Design service available - talk to our team",
    ];
  }
  return [...CARD_FEATURES];
}

/** Human label for the tier badge. */
export function tierLabel(tier: CardTier): string {
  if (tier === "premium") return "Premium";
  if (tier === "custom") return "Custom";
  return "Basic";
}
