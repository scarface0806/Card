import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "Shipping & Delivery Policy",
  description:
    "Production and delivery timelines for Tapvyo NFC cards, shipping charges, courier tracking and serviceable areas across India.",
  path: "/shipping-policy",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
