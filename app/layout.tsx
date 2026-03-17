import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
    variable: '--font-space-grotesk',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvyo.com'),
    title: 'Tapvyo - Modern NFC Digital Business Cards',
    description: 'Share your professional information with a single tap using NFC technology.',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
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
        images: ['/og-image.png'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
