import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "Refund & Cancellation Policy",
  description:
    "When a Tapvyo order can be cancelled, how refunds are processed, and how to claim a replacement for a damaged card.",
  path: "/refund-policy",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
