'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { META_PIXEL_ID, isAnalyticsExcludedPath, trackMetaEvent } from '@/lib/analytics';

/**
 * Meta (Facebook) Pixel, loaded the same way as GoogleAnalytics.tsx:
 * next/script with strategy="afterInteractive", so it never blocks paint.
 *
 * PRODUCTION ONLY, for the same reason as GA - dev and preview traffic must not
 * land in the live pixel. Nothing is rendered outside a production build.
 *
 * EXCLUDED ROUTES: /admin and /dashboard and everything under them, using the
 * same isAnalyticsExcludedPath check as GA. Meta has no kill switch like
 * GA's `ga-disable-<ID>`, so the exclusion after a client-side navigation
 * relies on two things: fbevents.js's own PageView-on-history-change is turned
 * off (`disablePushState`), and every event this site sends goes through
 * lib/analytics, which checks the route first.
 *
 * PAGEVIEW, EXACTLY ONCE PER PAGE. The init script sends the PageView for the
 * page it first runs on and records that path. The effect below sends one for
 * every later client-side route change. Either can run first on the initial
 * load, so the effect skips when the script has not run yet (it will send) or
 * already sent for this path.
 *
 * NOTE ON CONSENT: same position as GA - loads unconditionally in production.
 * See the consent note in GoogleAnalytics.tsx.
 */

declare global {
  interface Window {
    /** Path the last Meta PageView was sent for. */
    __tvMetaPageViewPath?: string;
  }
}

export default function MetaPixel() {
  const pathname = usePathname();
  const excluded = isAnalyticsExcludedPath(pathname);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!pathname || isAnalyticsExcludedPath(pathname)) return;
    // Init script not run yet: it sends this page's PageView itself.
    if (typeof window.fbq !== 'function') return;
    if (window.__tvMetaPageViewPath === pathname) return;

    if (trackMetaEvent('PageView')) window.__tvMetaPageViewPath = pathname;
  }, [pathname]);

  if (process.env.NODE_ENV !== 'production') return null;
  if (!META_PIXEL_ID) return null;
  if (excluded) return null;

  return (
    <>
      {/* Meta's standard base code. The `id` lets Next dedupe it across
          client-side navigations, so init and the first PageView run once. */}
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState = true;
fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
window.__tvMetaPageViewPath = window.location.pathname;`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's 1x1 tracking pixel, not content. */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
