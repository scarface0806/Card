'use client';

/**
 * Newsletter signup, for the footer's Contact column.
 *
 * Posts to the existing public POST /api/newsletter/subscribe. Nothing new is
 * added behind it: that route already rate limits, normalises the address,
 * de-duplicates against NewsletterSubscriber, reactivates a previously
 * unsubscribed address, and records a `source`. Everything that lands there
 * shows up in /admin/newsletters, which reads the same table.
 *
 * The route ALWAYS answers 200 with a human message for the cases that are not
 * really errors - already subscribed, welcomed back, honeypot tripped - so this
 * form renders whatever message comes back rather than inventing its own. That
 * keeps "you're already subscribed" from being reported as a failure.
 *
 * HONEYPOT: the route accepts an optional `website` field and, if it is filled,
 * returns success without writing anything. A bot that fills every input gets a
 * cheerful 200 and no row. The input is hidden from people and from screen
 * readers, and is deliberately NOT `type="hidden"` - bots skip those.
 */

import { useCallback, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface NewsletterSignupProps {
  /**
   * Recorded on the subscriber row so the admin list shows where someone signed
   * up. Defaults to the footer, which is the only placement today.
   */
  source?: string;
}

export default function NewsletterSignup({ source = 'footer' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot - see the note above
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === 'submitting') return;

      const trimmed = email.trim();
      if (!trimmed) return;

      setStatus('submitting');
      setMessage('');

      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, source, website }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          // 400 is a malformed address, 429 is the rate limiter. Both carry a
          // usable message from the route.
          setStatus('error');
          setMessage(payload?.error || 'Could not subscribe. Please try again.');
          return;
        }

        setStatus('success');
        setMessage(payload?.message || 'Subscribed.');
        setEmail('');
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    },
    [email, source, status, website]
  );

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <h3 className="tv-eyebrow mb-3">Newsletter</h3>
      <p className="tv-small mb-3">Occasional updates. No spam, unsubscribe anytime.</p>

      {/* Honeypot. aria-hidden + tabIndex -1 keeps it away from assistive tech
          and keyboard users; the wrapper is positioned off-screen rather than
          display:none, which some bots detect. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="nl-website">Do not fill this in</label>
        <input
          id="nl-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {/* Stacked, not side by side. This sits in the footer's fourth column,
          which is at its NARROWEST on desktop (~250px in the 4-up grid) and
          full width on mobile - the opposite of the usual assumption. An
          inline input+button pair cramps the field exactly where space is
          tightest, so both go full width at every size. */}
      <div className="flex flex-col gap-2">
        <label htmlFor="nl-email" className="sr-only">
          Email address for the newsletter
        </label>
        <input
          id="nl-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={status === 'submitting'}
          className="tv-focus min-h-[44px] w-full min-w-0 rounded-lg border border-[#F1F3F1]/15 bg-[#F1F3F1]/5 px-3 text-sm text-[#F1F3F1] placeholder:text-[#F1F3F1]/40 transition-colors focus:border-[#C9A961] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="tv-focus inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#C9A961] px-4 text-sm font-semibold text-[#12100C] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'submitting' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>

      {/* Announced as well as shown - the outcome is the only feedback there is. */}
      <p
        role="status"
        aria-live="polite"
        className={`tv-small mt-2 min-h-[1.25rem] ${
          status === 'error' ? 'text-[#E07A6E]' : 'text-[#4CAE89]'
        }`}
      >
        {message}
      </p>
    </form>
  );
}
