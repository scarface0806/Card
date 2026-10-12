/**
 * GA4 custom events, sent through the gtag already set up by
 * src/components/GoogleAnalytics.tsx, each mirrored to the matching Meta
 * standard event through the fbq set up by src/components/MetaPixel.tsx. This
 * file never loads a script of its own.
 *
 * Every call is a safe no-op when gtag / fbq is not on the page: in development
 * (both components render nothing), on /admin and /dashboard (excluded there),
 * during SSR, and when the init script has not run yet.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-PMLBD2Q7ZQ';

/** Meta Pixel ID. Public by design, like the GA ID - it is in the page source. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1451245263542276';

/** Routes analytics must never run on. Each prefix also covers its sub-routes. */
const EXCLUDED_PREFIXES = ['/admin', '/dashboard'];

export function isAnalyticsExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Google's documented kill switch: while `window['ga-disable-<ID>']` is true,
 * gtag sends nothing for that property. Idempotent, so safe to call on render.
 */
export function setAnalyticsDisabled(disabled: boolean): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled;
}

type GtagParams = Record<string, unknown>;

type MetaParams = Record<string, unknown>;

/** Fourth fbq argument. `eventID` lets Meta deduplicate the same event. */
interface MetaEventOptions {
  eventID?: string;
}

declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, params?: GtagParams) => void;
    fbq?: {
      (command: 'init', pixelId: string): void;
      (command: 'track', eventName: string, params?: MetaParams, options?: MetaEventOptions): void;
      /** Stops fbevents.js sending its own PageView on history changes. */
      disablePushState?: boolean;
    };
    _fbq?: unknown;
  }
}

/** Shared gate for both tags: production, in a browser, not an excluded route. */
function canTrack(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  if (typeof window === 'undefined') return false;
  return !isAnalyticsExcludedPath(window.location.pathname);
}

/** Send one Meta event. Returns true only when fbq took it. */
export function trackMetaEvent(
  eventName: string,
  params?: MetaParams,
  options?: MetaEventOptions
): boolean {
  if (!canTrack()) return false;
  if (typeof window.fbq !== 'function') return false;

  try {
    if (options) window.fbq('track', eventName, params, options);
    else window.fbq('track', eventName, params);
    return true;
  } catch {
    return false;
  }
}

/** The Meta standard event matching each GA4 event this site sends. */
function metaEventFor(
  eventName: string,
  params: GtagParams = {}
): [string, MetaParams, MetaEventOptions?] | null {
  switch (eventName) {
    case 'purchase': {
      const items = (params.items as AnalyticsItem[] | undefined) ?? [];
      return [
        'Purchase',
        {
          value: params.value,
          currency: 'INR',
          content_ids: items.map((item) => item.item_id).filter(Boolean),
          content_type: 'product',
          num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        },
        { eventID: String(params.transaction_id) },
      ];
    }
    case 'begin_checkout':
      return ['InitiateCheckout', { value: params.value, currency: 'INR' }];
    case 'generate_lead':
      return ['Lead', { content_category: params.form_type }];
    case 'whatsapp_click':
      return ['Contact', { method: 'whatsapp' }];
    case 'phone_click':
      return ['Contact', { method: 'phone' }];
    case 'email_click':
      return ['Contact', { method: 'email' }];
    default:
      return null;
  }
}

/**
 * Send one GA4 event, plus its Meta standard event when it has one. Returns
 * true when at least one of them was handed over, so a caller that must send
 * something exactly once (purchase) can tell "sent" from "skipped".
 */
export function trackEvent(eventName: string, params?: GtagParams): boolean {
  if (!canTrack()) return false;

  let sentToGa = false;
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, params);
      sentToGa = true;
    } catch {
      // Analytics only - ignore.
    }
  }

  const meta = metaEventFor(eventName, params);
  const sentToMeta = meta ? trackMetaEvent(...meta) : false;

  return sentToGa || sentToMeta;
}

export interface AnalyticsItem {
  item_id?: string;
  item_name: string;
  price: number;
  quantity: number;
}

export interface PurchaseDetails {
  transaction_id: string;
  value: number;
  currency: 'INR';
  items: AnalyticsItem[];
}

/*
 * Purchase hand-off. /order-success only receives ?orderId=, and that URL is
 * also linked from /dashboard, so it cannot fire purchase by itself. Checkout
 * stores the details here once payment is verified; the success page sends
 * them once and records the order ID so a refresh does not send it again.
 */
const PENDING_PURCHASE_KEY = 'ga_pending_purchase';
const SENT_PURCHASE_PREFIX = 'ga_purchase_sent:';

export function storePendingPurchase(details: PurchaseDetails): void {
  try {
    localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(details));
  } catch {
    // Storage unavailable (private mode, blocked). Analytics only - ignore.
  }
}

export function trackPurchaseOnce(orderId: string): void {
  try {
    const sentKey = `${SENT_PURCHASE_PREFIX}${orderId}`;
    if (localStorage.getItem(sentKey)) return;

    const raw = localStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return;

    const details = JSON.parse(raw) as PurchaseDetails;
    if (details.transaction_id !== orderId) return;

    // Only mark as sent when gtag or fbq actually took it (GA purchase and
    // Meta Purchase go out together, from this one call); otherwise the
    // pending details stay put and the next visit can still send them.
    if (trackEvent('purchase', { ...details })) {
      localStorage.setItem(sentKey, '1');
      localStorage.removeItem(PENDING_PURCHASE_KEY);
    }
  } catch {
    // Storage unavailable or malformed JSON. Analytics only - ignore.
  }
}

/** WhatsApp link location: an explicit data attribute, else the page region. */
function clickLocation(anchor: HTMLAnchorElement): string {
  const tagged = anchor.closest<HTMLElement>('[data-analytics-location]');
  if (tagged?.dataset.analyticsLocation) return tagged.dataset.analyticsLocation;
  if (anchor.closest('footer')) return 'footer';
  if (anchor.closest('header, nav')) return 'header';
  return window.location.pathname === '/' ? 'home' : window.location.pathname;
}

/**
 * One delegated listener for whatsapp_click, phone_click and email_click, so
 * every such link on the site is covered without editing each one.
 */
export function handleContactLinkClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest<HTMLAnchorElement>('a[href]');
  if (!anchor) return;

  const href = anchor.getAttribute('href') ?? '';
  const lower = href.toLowerCase();

  if (lower.startsWith('tel:')) {
    trackEvent('phone_click', { location: clickLocation(anchor) });
  } else if (lower.startsWith('mailto:')) {
    trackEvent('email_click', { location: clickLocation(anchor) });
  } else if (/^(https?:)?\/\/(wa\.me|(api\.|web\.)?whatsapp\.com)\b/.test(lower) || lower.startsWith('whatsapp:')) {
    trackEvent('whatsapp_click', { location: clickLocation(anchor) });
  }
}
