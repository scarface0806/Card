import type { Metadata } from 'next';
import { Inter, Fraunces, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import JsonLd from '@/components/JsonLd';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { CANONICAL_ORIGIN, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/lib/site-config';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

/* ---------------------------------------------------------------------------
   Tapvyo display/body/utility faces.

   Plus Jakarta Sans (--font-space-grotesk) was REMOVED. Its only consumers
   were Heading.tsx and four section components - PremiumPricing, PremiumBento,
   PremiumNavbar/Hero, CurvedFeature, PricingPreview, TemplatePreview - none of
   which were rendered by any route. The font was downloading five weights on
   every page for markup that never existed. Inter stays: globals.css sets it
   as the `body` face, so it is genuinely the base for anything the tv-*
   system does not override.
   --------------------------------------------------------------------------- */

// Display. Optical-sized, high-contrast serif; used for headings only.
// SOFT/WONK are pinned to 0 so it reads sharp and editorial rather than folksy.
const fraunces = Fraunces({
    variable: '--font-display',
    subsets: ['latin'],
    display: 'swap',
    /**
     * `opsz` ONLY. Every rule that uses this face pins SOFT and WONK to 0
     * (`font-variation-settings: "SOFT" 0, "WONK" 0` - see .tv-display and the
     * three other display rules in globals.css), and 0 is Fraunces's own
     * default for both. Shipping those two axes therefore bought nothing and
     * cost a great deal: a variable font's file size scales with the axes it
     * carries, and this was the single largest asset on the site at 118 KB,
     * preloaded on every page.
     *
     * `opsz` stays because `font-optical-sizing: auto` genuinely uses it.
     *
     * Rendering is unchanged: with the axes gone the font renders at its
     * defaults, which are the values those rules were pinning it to anyway.
     */
    axes: ['opsz'],
});

// Body.
const manrope = Manrope({
    variable: '--font-body',
    subsets: ['latin'],
    display: 'swap',
});

// Utility: step numbers, specs, prices, the card face data.
const jetbrainsMono = JetBrains_Mono({
    variable: '--font-mono',
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    /**
     * The origin every relative URL below resolves against — canonicals,
     * OG URLs, Twitter images.
     *
     * CANONICAL_ORIGIN, not SITE_URL. SITE_URL is env-configurable, and on the
     * production deployment it was resolving to the old tapvyo-nfc-card.vercel.app
     * alias, which stamped a .vercel.app canonical onto every page on tapvyo.in.
     * Google reads the canonical tag over the 308 redirect, so it indexed the
     * pages under the old host. What a search engine is told is the site's
     * address is not something a dashboard env var should be able to change.
     */
    metadataBase: new URL(CANONICAL_ORIGIN),
    title: {
        // Each route sets its own title; this is the suffix and the fallback.
        default: `${SITE_NAME} - ${SITE_TAGLINE}`,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: { canonical: '/' },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            // "large" opts into full-size image thumbnails in results; the two
            // -1s remove Google's default caps on snippet length and video
            // preview length. Without them Google applies conservative
            // defaults and the listing shows less than it could.
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },
    /**
     * One icon, declared once.
     *
     * This used to advertise five: the .ico, an SVG, and 192/512 PNGs. Google
     * picks a single favicon per site and its own docs ask for one square
     * source that is a multiple of 48px; handing it a pile of candidates in
     * different formats gave it a choice it did not need to make. /favicon.ico
     * now carries 16, 32, 48 and 96 in one file, so the tab, the bookmark bar
     * and Google's 48px crawler are all served by the same URL.
     *
     * The PWA sizes are not dropped — they are declared in site.webmanifest,
     * which is where an install prompt looks for them. They do not belong in
     * <head> as well.
     */
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/apple-icon.png',
    },
    manifest: '/site.webmanifest',

    /**
     * Google Search Console site verification.
     *
     * Next renders this as <meta name="google-site-verification" content="..." />
     * in <head>, which is exactly what GSC's "HTML tag" method looks for. Set it
     * here rather than hand-writing the tag: a raw <meta> in a layout is easy to
     * lose in a refactor, and Next dedupes/owns the head.
     *
     * The token is NOT a secret - it is public in the HTML by design, and only
     * proves domain control to Google. It stays hardcoded so verification cannot
     * silently break because an env var was missed on a deploy.
     *
     * Do not remove it after verification passes. Google re-checks periodically
     * and will un-verify the property if the tag disappears.
     */
    verification: {
        google: 'Y8T-zHOqJkpI6tbMRjRHRhcca_6XYfixjeiTLyz7OIA',
    },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_IN',
        url: '/',
        title: `${SITE_NAME} - ${SITE_TAGLINE}`,
        description: SITE_DESCRIPTION,
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Tapvyo social preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${SITE_NAME} - ${SITE_TAGLINE}`,
        description: SITE_DESCRIPTION,
        images: ['/twitter-image.png'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
                {children}
                <JsonLd />
                {/* Renders nothing outside a production build - see the note in
                    the component. Placed last so it can never sit ahead of page
                    content in the document order. */}
                <GoogleAnalytics />
            </body>
        </html>
    );
}
