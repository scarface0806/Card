/**
 * Artwork guidance for Customised Card uploads. Client-safe (no server
 * imports), shared by the /cards section and the checkout upload step so the
 * two never quote different sizes.
 *
 * A standard CR80 card is 85.6 x 54 mm. At 300 DPI - the usual minimum for a
 * sharp print - that is 85.6 / 25.4 * 300 ≈ 1011 px by 54 / 25.4 * 300 ≈ 638 px.
 * A vertical card is the same card stood on its end, so the numbers swap.
 */
import type { CardOrientation } from './orientation';

export const CARD_SIZE_MM = { long: 85.6, short: 54 } as const;
export const PRINT_DPI = 300;
export const RECOMMENDED_PX = { long: 1011, short: 638 } as const;

export function recommendedArtworkSize(orientation: CardOrientation): {
  width: number;
  height: number;
  label: string;
} {
  const vertical = orientation === 'vertical';
  const width = vertical ? RECOMMENDED_PX.short : RECOMMENDED_PX.long;
  const height = vertical ? RECOMMENDED_PX.long : RECOMMENDED_PX.short;
  const mm = vertical
    ? `${CARD_SIZE_MM.short} × ${CARD_SIZE_MM.long} mm`
    : `${CARD_SIZE_MM.long} × ${CARD_SIZE_MM.short} mm`;

  return {
    width,
    height,
    label: `${vertical ? 'Portrait' : 'Landscape'}, ${width} × ${height} px or larger (${mm} at ${PRINT_DPI} DPI)`,
  };
}

/** True when an uploaded image is smaller than the 300 DPI recommendation. */
export function isBelowRecommended(
  orientation: CardOrientation,
  size: { width: number; height: number }
): boolean {
  const { width, height } = recommendedArtworkSize(orientation);
  return size.width < width || size.height < height;
}

export const ARTWORK_FILE_NOTE = 'JPEG, PNG or WEBP, up to 10MB each.';
