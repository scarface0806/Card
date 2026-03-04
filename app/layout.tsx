import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import { ProductProvider } from '@/contexts/ProductContext';

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
  title: 'Tapvyo - Modern NFC Digital Business Cards',
  description:
    'Share your professional information with a single tap using NFC technology. Premium digital business cards made simple and elegant.',
  keywords: [
    'NFC technology',
    'digital business card',
    'contact sharing',
    'professional network',
    'business card',
    'NFC card',
  ],
  authors: [{ name: 'Tapvyo' }],
  creator: 'Tapvyo',
  openGraph: {
    type: 'website',
    url: 'https://tapvyo-nfc.com',
    title: 'Tapvyo - Modern NFC Digital Business Cards',
    description: 'Revolutionary way to share your professional information',
    siteName: 'Tapvyo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tapvyo - Modern NFC Digital Business Cards',
    description: 'Share your information with a single tap',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-slate-950 text-white`} suppressHydrationWarning>
        <AuthProvider>
          <ProductProvider>
            {children}
          </ProductProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
