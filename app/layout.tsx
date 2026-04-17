import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvyo.com'),
    title: 'Tapvyo - Modern NFC Digital Business Cards',
    description: 'Share your professional information with a single tap using NFC technology.',
    icons: {
        icon: [
            { url: '/icon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: '48x48' },
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
            <body className={`${inter.variable} ${plusJakarta.variable} antialiased`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
