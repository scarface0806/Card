/**
 * POST-AUTH RETURN PATH, VALIDATED.
 *
 * Shared by /login and /signup. Both are reached with `?redirect=<path>` from
 * proxy.ts and from the /create-card server gate, and both previously ignored
 * it - login always pushed /dashboard, signup always pushed "/" - which
 * dropped a customer who was mid-purchase.
 *
 * Client-safe on purpose: this must not import next/headers or anything
 * server-only, because the two pages using it are `'use client'`. The
 * server-side equivalent for building the outbound URL lives in
 * src/lib/session.ts (`loginRedirect`).
 *
 * ONLY same-site relative paths are honoured. Everything else falls back, so
 * `?redirect=https://evil.com` cannot turn either form into an open redirect
 * that carries a freshly authenticated visitor off-site.
 */

/** Character codes for "/" and "\" - both start a protocol-relative URL. */
const SLASH = 47;
const BACKSLASH = 92;

export function safeRedirect(raw: string | null, fallback = '/cards'): string {
  if (!raw) return fallback;

  // Must be a rooted relative path. "https://evil.com" and "evil.com" both fail.
  if (!raw.startsWith('/')) return fallback;

  // "//evil.com" and "/\evil.com" are resolved by browsers as ANOTHER ORIGIN,
  // even though they start with a single "/". Reject both.
  const second = raw.charCodeAt(1);
  if (second === SLASH || second === BACKSLASH) return fallback;

  // Never bounce back into the auth pages - that is a redirect loop.
  if (raw.startsWith('/login') || raw.startsWith('/signup')) return fallback;

  return raw;
}

/**
 * Carry the current return path onto the sibling auth page, so someone gated
 * out of checkout who switches from "Login" to "Sign up" keeps their
 * destination instead of silently losing it.
 */
export function withRedirect(path: string, redirectTo: string | null): string {
  if (!redirectTo) return path;
  return `${path}?redirect=${encodeURIComponent(redirectTo)}`;
}
