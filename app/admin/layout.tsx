import type { Metadata } from 'next';
import AdminShell from './AdminShell';

/**
 * Server wrapper so the admin area can declare metadata — AdminShell is a
 * client component, and a client layout cannot export `metadata`.
 *
 * Without this every /admin URL inherited the root layout's homepage title,
 * `index, follow` and canonical "/". robots.txt disallows /admin, but that
 * only stops crawling: a linked URL can still be indexed. noindex is what
 * keeps it out, and no canonical is declared for a private page.
 */
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
