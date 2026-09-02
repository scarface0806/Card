import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 *
 * noindex: this is behind auth and shows one customer's order history. It is
 * also in the robots.ts disallow list.
 */
export const metadata = pageMetadata({
  title: "My Orders",
  description:
    "Track your Tapvyo card orders, delivery status and profile link.",
  path: "/my-orders",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
