import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

/**
 * Builds a route's metadata.
 *
 * Next.js shallow-merges metadata: a child that declares `openGraph` replaces
 * the parent's `openGraph` wholesale rather than merging into it. Declaring
 * only title/description/url in a segment layout therefore silently drops
 * og:image, og:type, og:site_name and og:locale from that route. This helper
 * re-declares the inherited pieces so every page keeps a complete card.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_IN',
      url: path,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} social preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/twitter-image.png`],
    },
  };
}
