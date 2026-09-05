'use client';

/**
 * Desktop notifications for new orders, for the admin shell.
 *
 * Polls the existing admin orders endpoint and raises a browser notification
 * when an order appears that this browser has not seen before. There is no push
 * service, no service worker and no new table: Notification is a foreground API
 * and the admin tab is the thing being notified, which is what "desktop
 * notification while I have the dashboard open" actually needs. Web Push would
 * mean VAPID keys in env and a subscription table - both explicitly out of
 * scope - and would not work any better while the tab is open.
 *
 * POLLING, NOT SOCKETS: the project has no realtime transport, and adding one
 * for a low-frequency event (a handful of orders a day) is not worth a
 * long-lived connection. 60s is slow enough to be free in practice - one
 * indexed query per minute per open admin tab - and fast enough that the alert
 * still feels immediate.
 *
 * The "last seen" marker is the newest order id, persisted per browser. That
 * matters on two counts: a page refresh must not re-announce orders already
 * seen, and the FIRST ever load must announce nothing at all - otherwise
 * opening the dashboard fires a notification for whatever the newest existing
 * order happens to be.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** One poll a minute. See the note above on why this is not a socket. */
const POLL_INTERVAL_MS = 60_000;

/** Newest order id this browser has already announced. */
const LAST_SEEN_KEY = 'admin:lastAnnouncedOrderId';

/**
 * Never raise more than this many notifications at once. If the tab was asleep
 * through a busy hour, twenty stacked banners help nobody - the badge count
 * carries the real number.
 */
const MAX_NOTIFICATIONS_PER_POLL = 3;

/** How many orders to look at per poll. Bounds the "while you were away" catch-up. */
const POLL_PAGE_SIZE = 10;

export type NotificationPermissionState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied';

interface PolledOrder {
  id: string;
  orderNumber?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  cardType?: string | null;
  price?: number | null;
  total?: number | null;
}

function readLastSeen(): string | null {
  try {
    return window.localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    // Private mode, or site data blocked. Falling back to null means this
    // session behaves like a first load: it sets a baseline and announces
    // nothing, which is the safe direction to fail.
    return null;
  }
}

function writeLastSeen(id: string): void {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, id);
  } catch {
    // Non-fatal - the marker just will not survive this tab.
  }
}

function describeOrder(order: PolledOrder): { title: string; body: string } {
  const who = order.guestName || order.guestEmail || 'Guest';
  const what = order.cardType || 'Card order';
  const amount = order.price ?? order.total;
  const price = typeof amount === 'number' ? ` · ₹${amount.toLocaleString('en-IN')}` : '';

  return {
    title: `New order — ${who}`,
    body: `${what}${price}${order.orderNumber ? ` · ${order.orderNumber}` : ''}`,
  };
}

export function useNewOrderNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  /** Orders seen since the admin last acknowledged the bell. Drives the badge. */
  const [unseenCount, setUnseenCount] = useState(0);

  // Refs, not state: the poll loop reads these and must not be a reason to
  // re-run the effect that owns the interval.
  const lastSeenRef = useRef<string | null>(null);
  const baselineSetRef = useRef(false);
  const permissionRef = useRef<NotificationPermissionState>('unsupported');

  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  // Reading Notification.permission has to happen after mount, not in a lazy
  // useState initializer: that runs during render, where `window` does not
  // exist on the server, and seeding it with a guess would hydrate to a
  // different value than the browser reports. Syncing an external browser API
  // on mount is exactly the case the rule cannot see through, so it is
  // silenced on the one line that sets it.
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'Notification' in window;

    if (supported) {
      lastSeenRef.current = readLastSeen();
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(
      supported ? (Notification.permission as NotificationPermissionState) : 'unsupported'
    );
  }, []);

  /**
   * Ask for permission. Must be called from a real click: Safari, and Chrome on
   * Android, reject a request that is not tied to a user gesture, and Chrome
   * desktop penalises pages that ask on load.
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const result = (await Notification.requestPermission()) as NotificationPermissionState;
      setPermission(result);
      return result;
    } catch {
      // Older Safari used a callback signature and can reject the promise form.
      return Notification.permission as NotificationPermissionState;
    }
  }, []);

  /** Clear the badge - the admin has looked. */
  const acknowledge = useCallback(() => setUnseenCount(0), []);

  const poll = useCallback(async (signal: AbortSignal) => {
    let response: Response;
    try {
      response = await fetch(`/api/admin/orders?limit=${POLL_PAGE_SIZE}`, {
        credentials: 'include',
        signal,
      });
    } catch {
      // Offline, or the tab was backgrounded mid-request. Try again next tick.
      return;
    }

    // A 401 means the admin session lapsed; the layout's own auth check will
    // redirect. Staying quiet here avoids a console full of noise until it does.
    if (!response.ok) return;

    const payload = await response.json().catch(() => null);
    const orders: PolledOrder[] = payload?.orders ?? [];
    if (orders.length === 0) return;

    // The endpoint sorts by createdAt desc by default, so index 0 is newest.
    const newest = orders[0];

    // First run on this browser: record where we are and announce nothing.
    // Without this, simply opening the dashboard fires a notification for an
    // order that may be days old.
    if (!baselineSetRef.current && lastSeenRef.current === null) {
      baselineSetRef.current = true;
      lastSeenRef.current = newest.id;
      writeLastSeen(newest.id);
      return;
    }
    baselineSetRef.current = true;

    if (newest.id === lastSeenRef.current) return;

    // Everything newer than the marker. If the marker is no longer in this page
    // of results the tab has been asleep a long while: fall back to treating
    // the whole page as new rather than silently dropping it.
    const seenIndex = orders.findIndex((order) => order.id === lastSeenRef.current);
    const fresh = seenIndex === -1 ? orders : orders.slice(0, seenIndex);
    if (fresh.length === 0) return;

    lastSeenRef.current = newest.id;
    writeLastSeen(newest.id);
    setUnseenCount((count) => count + fresh.length);

    if (permissionRef.current !== 'granted') return;

    for (const order of fresh.slice(0, MAX_NOTIFICATIONS_PER_POLL)) {
      const { title, body } = describeOrder(order);
      try {
        const notification = new Notification(title, {
          body,
          // Tagging by order id means a duplicate poll can never stack two
          // banners for the same order.
          tag: `order-${order.id}`,
          icon: '/icon-192.png',
        });
        notification.onclick = () => {
          window.focus();
          window.location.href = '/admin/orders';
        };
      } catch {
        // Some browsers throw when constructing a Notification outside a
        // service worker (notably Chrome on Android). The badge still updates,
        // so the admin is not left with nothing.
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Poll straight away so a tab left open overnight catches up on focus
    // rather than waiting a full interval.
    //
    // Not a synchronous setState despite what the rule reads: poll() awaits a
    // fetch before it touches any state, so nothing is set during this render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void poll(controller.signal);
    const timer = window.setInterval(() => void poll(controller.signal), POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [poll]);

  return { permission, requestPermission, unseenCount, acknowledge };
}

export default useNewOrderNotifications;
