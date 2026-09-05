/**
 * CARD ORIENTATION - horizontal (landscape) or vertical (portrait).
 *
 * One module so the aspect ratio, the default and the catalogue ordering are
 * decided in a single place. The ratio in particular was previously written as
 * a literal `aspect-[1.6/1]` in four separate files; adding a second shape by
 * hand would have meant four more places to keep in step.
 *
 * Pure and framework-free: the server loader, the client hook, the admin form
 * and the catalogue components all import from here.
 */

export type CardOrientation = 'horizontal' | 'vertical';

export const CARD_ORIENTATIONS: readonly CardOrientation[] = [
  'horizontal',
  'vertical',
];

/**
 * Horizontal is the default, and deliberately what `null` means.
 *
 * Every product created before this field existed stores nothing here, and
 * every one of those is a landscape card - so reading null as "horizontal"
 * makes the whole existing catalogue correct without a backfill.
 */
export const DEFAULT_ORIENTATION: CardOrientation = 'horizontal';

export function normalizeOrientation(value: unknown): CardOrientation {
  return value === 'vertical' ? 'vertical' : DEFAULT_ORIENTATION;
}

/**
 * Tailwind aspect-ratio class for a card face.
 *
 * 1.6 is the ISO/IEC 7810 ID-1 ratio a real card is cut to (85.6 x 53.98 mm),
 * so vertical is the same card stood on its end rather than an invented shape.
 */
export function cardAspectClass(orientation: CardOrientation): string {
  return orientation === 'vertical' ? 'aspect-[1/1.6]' : 'aspect-[1.6/1]';
}

/**
 * Catalogue order: horizontal cards first, then vertical.
 *
 * A stable comparator - it only separates the two groups and leaves the order
 * WITHIN each group exactly as the database returned it, so the existing
 * `createdAt desc` sort still decides which card leads.
 */
export function byOrientation(
  a: { orientation?: CardOrientation },
  b: { orientation?: CardOrientation }
): number {
  const rank = (o?: CardOrientation) => (o === 'vertical' ? 1 : 0);
  return rank(a.orientation) - rank(b.orientation);
}
