import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only - the tracking form below is a client component and cannot
 * export `metadata` itself. Indexed, because customers search for this page;
 * nothing on it is reachable without a reference and a matching mobile number.
 */
export const metadata = pageMetadata({
  title: 'Track Your Order',
  description:
    'Track your Tapvyo NFC card order. Enter your order reference and the mobile number you used at checkout.',
  path: '/track-order',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
