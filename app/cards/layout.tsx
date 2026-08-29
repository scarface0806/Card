import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "NFC Card Designs",
  description:
    "Browse Tapvyo NFC business card designs - matte, metal and premium finishes. Every card includes a free lifetime digital profile.",
  path: "/cards",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
