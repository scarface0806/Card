import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "Products",
  description:
    "The full Tapvyo NFC card catalogue with current pricing, materials and finishes.",
  path: "/products",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
