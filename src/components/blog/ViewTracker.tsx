'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  slug: string;
}

const SESSION_ID_KEY = 'tv-blog-session';

/**
 * Records one view per session, once, without blocking or affecting the page.
 *
 * Renders nothing. Every failure path here is silent by design: analytics must
 * never degrade a reader's experience of the article.
 */
export default function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    let sessionId: string;
    const seenKey = `tv-blog-viewed:${slug}`;

    try {
      // Set BEFORE the request, not after. React strict mode mounts effects
      // twice in development; writing the guard first means the second pass
      // sees it and never fires. The server debounces as well, so a cleared
      // guard cannot inflate the count either.
      if (window.sessionStorage.getItem(seenKey)) return;
      window.sessionStorage.setItem(seenKey, '1');

      sessionId = window.sessionStorage.getItem(SESSION_ID_KEY) ?? crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    } catch {
      // sessionStorage throws in some privacy modes. Skip tracking entirely
      // rather than counting a view on every render.
      return;
    }

    // Deliberately not aborted on unmount: this is a beacon, and cancelling it
    // when the reader navigates away is exactly when it most needs to land.
    void fetch(`/api/blog/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ sessionId, referrer: document.referrer || '' }),
    }).catch(() => {
      // Offline, blocked by an extension, rate limited. All fine.
    });
  }, [slug]);

  return null;
}
