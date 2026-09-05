import Script from 'next/script';

/**
 * GA4, loaded the Next.js way.
 *
 * Google's setup page tells you to paste two raw <script> tags immediately
 * after <head>. That advice is written for hand-built HTML. Pasting it into a
 * Next app would put a render-blocking synchronous script ahead of the page,
 * which is the same class of problem as the render-blocking CSS finding - and
 * on a site already fighting for LCP that is a bad trade for a tag that does
 * not need to run before paint.
 *
 * `next/script` with strategy="afterInteractive" loads gtag once the page is
 * interactive. No measurement is lost: gtag queues into `dataLayer`, so the
 * first page_view is recorded with the right timestamp even though the script
 * arrived later. This is the strategy Google's own @next/third-parties package
 * uses; we do it with the built-in Script component instead so no new
 * dependency is added.
 *
 * PRODUCTION ONLY. Without this gate, `npm run dev` and every preview
 * deployment would report into the same GA4 property as real customers, and
 * the numbers you make decisions on would include your own testing. Nothing is
 * rendered at all outside a production build.
 *
 * NOTE ON CONSENT: this loads analytics unconditionally in production. India's
 * DPDP Act 2023 is stricter than a cookie banner about notice and purpose, and
 * if you ever take EEA traffic you need Consent Mode. Neither is handled here -
 * see the handover note.
 */

/**
 * Measurement ID. Public by design - it is visible in the page source of every
 * site that uses GA4, and identifies the property, not an account.
 *
 * Overridable via NEXT_PUBLIC_GA_ID so a second property (a staging one, say)
 * can be pointed at without editing code, but it defaults to the real ID so
 * analytics cannot silently stop working because an env var was missed on a
 * deploy.
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-PMLBD2Q7ZQ';

export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production') return null;
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/* The `id` is required: it is how Next dedupes an inline script across
          client-side navigations, so this initialiser runs exactly once. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
