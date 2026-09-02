/**
 * SERVER-COMPONENT SESSION READER.
 *
 * SERVER-ONLY. `authenticate()` in src/lib/auth-middleware.ts needs a
 * NextRequest, which a React Server Component never has. This reads the same
 * cookies through next/headers instead, so a page can gate itself with the
 * identical token and the identical verification.
 *
 * It reads the SAME three cookie names, in the same order, as
 * `authenticate()` and proxy.ts. Keep all three in sync: a name that only one
 * of them knows about is a hole where a request looks authenticated to one
 * layer and anonymous to another.
 *
 * This is defence in depth, NOT the primary gate. proxy.ts redirects an
 * anonymous visitor before the page renders; this catches the cases middleware
 * does not see, and means a page is never the only thing standing between an
 * anonymous request and a purchase.
 */

import { cookies } from "next/headers";

import { verifyToken, type AuthUser } from "@/lib/auth";

/** The signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const jar = await cookies();

    const token =
      jar.get("auth-token")?.value ||
      jar.get("admin-token")?.value ||
      jar.get("token")?.value ||
      null;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // A malformed cookie jar must read as "logged out", never as an error page.
    return null;
  }
}

/**
 * Build the login URL that returns the visitor to where they were going.
 *
 * `next` must already include any query string - dropping it is how a customer
 * loses the product they picked on /cards and lands on a bare /create-card.
 */
export function loginRedirect(next: string): string {
  return `/login?redirect=${encodeURIComponent(next)}`;
}
