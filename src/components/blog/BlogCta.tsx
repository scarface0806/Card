import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

/**
 * Closing CTA, matching the one that ends the other marketing pages: the same
 * ink section, the same brass hairline above it, the same centred stack. Built
 * as a server component with the system button rather than the products page's
 * one-off gradient, so it carries no client JavaScript.
 */
export default function BlogCta() {
  return (
    <section className="tv-surface-ink tv-section">
      <div className="site-container">
        <div className="relative border-t border-[#C9A961]/25 pt-12 text-center md:pt-16">
          <h2 className="tv-h2 mb-5">Ready to hand over one card, once?</h2>
          <p className="tv-lead mx-auto mb-9 max-w-2xl">
            Build your Tapvyo card in a few minutes. One tap shares everything you would have printed.
          </p>
          <Link href={ROUTES.CREATE_CARD} className="tv-btn tv-btn-primary tv-btn-lg tv-focus">
            Create your card
            <ArrowUpRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
