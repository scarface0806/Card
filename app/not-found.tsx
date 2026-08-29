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
    <div className="frontend-dark flex min-h-screen flex-col items-center justify-center bg-[#020617] px-6 py-24 text-center text-slate-50">
      <p className="font-space-grotesk text-7xl font-extrabold text-primary md:text-8xl">404</p>

      <h1 className="mt-6 font-space-grotesk text-3xl font-bold text-white md:text-4xl">
        We can&rsquo;t find that page
      </h1>

      <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
        The link may be out of date, or the page may have moved. Everything else
        on {SITE_NAME} is still where you left it.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href={ROUTES.HOME}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-8 py-3 font-semibold text-[#04160f] transition-colors hover:bg-primary/90"
        >
          Back to home
        </Link>
        <Link
          href={ROUTES.CARDS}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-8 py-3 font-semibold text-white transition-colors hover:border-primary/60 hover:bg-white/5"
        >
          Browse cards
        </Link>
        <Link
          href={ROUTES.CONTACT}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-8 py-3 font-semibold text-white transition-colors hover:border-primary/60 hover:bg-white/5"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
