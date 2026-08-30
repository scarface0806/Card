import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Fraunces, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import JsonLd from '@/components/JsonLd';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site-config';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
    variable: '--font-space-grotesk',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
});

/* ---------------------------------------------------------------------------
   Tapvyo display/body/utility faces.
   Inter and Plus Jakarta above are still loaded: the admin panel and the other
   frontend pages reference --font-inter and --font-space-grotesk, so removing
   them would restyle surfaces outside this redesign's scope.
   --------------------------------------------------------------------------- */

// Display. Optical-sized, high-contrast serif; used for headings only.
// SOFT/WONK are pinned to 0 so it reads sharp and editorial rather than folksy.
const fraunces = Fraunces({
    variable: '--font-display',
    subsets: ['latin'],
    display: 'swap',
    axes: ['SOFT', 'WONK', 'opsz'],
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
    // metadataBase used to default to https://tapvyo.com, which does not
    // resolve. Every OG and Twitter image URL it produced was dead. SITE_URL
    // resolves to the actual deployment origin.
    metadataBase: new URL(SITE_URL),
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
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/icon.svg', type: 'image/svg+xml' },
            { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
        other: [
            { rel: 'maskable icon', url: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png' },
        ],
    },
    manifest: '/manifest.json',
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
            <body className={`${inter.variable} ${plusJakarta.variable} ${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
                {children}
                <JsonLd />
            </body>
        </html>
    );
}
