import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "How It Works",
  description:
    "How a Tapvyo NFC card works - tap to share, no app needed for the person you tap, and profile updates handled by our team.",
  path: "/how-to-use",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
