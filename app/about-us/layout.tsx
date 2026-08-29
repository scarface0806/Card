import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Who we are and why we build NFC business cards that replace paper for good.",
  path: "/about-us",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
