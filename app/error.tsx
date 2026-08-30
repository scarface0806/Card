'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';
import { SUPPORT_EMAIL } from '@/lib/site-config';

/**
 * Route-level error boundary. Catches render and data errors below the root
 * layout and offers a retry rather than leaving a blank page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle support has on a production stack trace.
    console.error('[App error]', error.digest ?? '', error);
  }, [error]);

  return (
    <div className="frontend-dark tv-hero flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <p className="tv-eyebrow tv-eyebrow--center mb-8">Error 500</p>

      <h1 className="tv-h2">
        Something went wrong
      </h1>

      <p className="tv-lead mt-5 max-w-md">
        This one is on us, not on you. Try again &mdash; if it keeps happening,
        email us at{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="tv-btn-tertiary !min-h-0"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>

      {error.digest && (
        <p className="tv-mono mt-4">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="tv-btn tv-btn-lg tv-btn-primary"
        >
          Try again
        </button>
        <Link
          href={ROUTES.HOME}
          className="tv-btn tv-btn-lg tv-btn-secondary"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
