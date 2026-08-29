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
    <div className="frontend-dark flex min-h-screen flex-col items-center justify-center bg-[#020617] px-6 py-24 text-center text-slate-50">
      <p className="font-space-grotesk text-7xl font-extrabold text-primary md:text-8xl">500</p>

      <h1 className="mt-6 font-space-grotesk text-3xl font-bold text-white md:text-4xl">
        Something went wrong
      </h1>

      <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
        This one is on us, not on you. Try again &mdash; if it keeps happening,
        email us at{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>

      {error.digest && (
        <p className="mt-3 text-xs text-slate-500">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-8 py-3 font-semibold text-[#04160f] transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href={ROUTES.HOME}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-8 py-3 font-semibold text-white transition-colors hover:border-primary/60 hover:bg-white/5"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
