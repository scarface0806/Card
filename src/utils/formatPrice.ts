/**
 * Format price to Indian Rupees
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format price with sale price comparison
 */
export function formatPriceWithSale(
  price: number,
  salePrice?: number | null
): { current: string; original?: string; discount?: number } {
  if (salePrice && salePrice < price) {
    const discount = Math.round(((price - salePrice) / price) * 100);
    return {
      current: formatPrice(salePrice),
      original: formatPrice(price),
      discount,
    };
  }
  return { current: formatPrice(price) };
}

/**
 * Parse price string like "₹599" to number
 */
export function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/[₹,\s]/g, "");
  return parseFloat(cleaned) || 0;
}
