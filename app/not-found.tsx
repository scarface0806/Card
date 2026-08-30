import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';
import { SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="frontend-dark tv-hero flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <p className="tv-eyebrow tv-eyebrow--center mb-8">Error 404</p>

      <h1 className="tv-h2">
        We can&rsquo;t find that page
      </h1>

      <p className="tv-lead mt-5 max-w-md">
        The link may be out of date, or the page may have moved. Everything else
        on {SITE_NAME} is still where you left it.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href={ROUTES.HOME}
          className="tv-btn tv-btn-lg tv-btn-primary"
        >
          Back to home
        </Link>
        <Link
          href={ROUTES.CARDS}
          className="tv-btn tv-btn-lg tv-btn-secondary"
        >
          Browse cards
        </Link>
        <Link
          href={ROUTES.CONTACT}
          className="tv-btn tv-btn-lg tv-btn-secondary"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
