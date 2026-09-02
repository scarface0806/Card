import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 */
export const metadata = pageMetadata({
  title: "Forgot Password",
  description:
    "Request a link to reset the password on your Tapvyo account.",
  path: "/forgot-password",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
