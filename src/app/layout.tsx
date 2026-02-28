import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../app/globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
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
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white text-black`}>
        {children}
      </body>
    </html>
  );
}
