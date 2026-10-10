import { CANONICAL_ORIGIN } from '@/lib/site-config';
import type { CardDesign } from '@/lib/products/cardDesign';

/**
 * Product + AggregateOffer structured data for the card catalogue.
 *
 * Rendered ONLY on the pages that show the catalogue — the homepage and
 * /cards — and fed the same designs those pages render. It used to live in the
 * root layout's JsonLd, which put a Product with prices on every page,
 * blog posts and policy pages included, and its 599/799/6 figures were typed
 * in by hand rather than read from the catalogue.
 *
 * Prices are each design's effective price (sale price when one is active),
 * the same number the card shows. Renders nothing for an empty catalogue: an
 * offer with no prices is invalid, and getCardDesigns() returns [] when the
 * database is unreachable.
 *
 * No aggregateRating: there is no review data to support one.
 *
 * Server component - markup only, no client JS.
 */
export default function ProductJsonLd({ designs }: { designs: CardDesign[] }) {
  const prices = designs.map((design) => design.priceValue).filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length === 0) return null;

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${CANONICAL_ORIGIN}/#product`,
    name: 'Tapvyo NFC Digital Business Card',
    description:
      'An NFC business card that shares your contact details with a single tap, bundled with a free lifetime digital profile page.',
    brand: { '@id': `${CANONICAL_ORIGIN}/#organization` },
    category: 'Business Cards',
    url: `${CANONICAL_ORIGIN}/cards`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: String(Math.min(...prices)),
      highPrice: String(Math.max(...prices)),
      offerCount: String(prices.length),
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${CANONICAL_ORIGIN}/#organization` },
    },
  };

  return (
    <script
      type="application/ld+json"
      // Values are our own constants and catalogue data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
    />
  );
}
