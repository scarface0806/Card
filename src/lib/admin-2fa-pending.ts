/**
 * The short-lived "password OK, code still needed" token for two-step admin
 * login. SERVER-ONLY.
 *
 * When an admin with 2FA enabled gets the password right, /api/admin/login
 * issues ONLY this - never the session. /api/admin/login/2fa then needs this
 * token AND a valid TOTP or backup code before it issues the real session.
 *
 * WHY A DERIVED KEY, NOT JWT_SECRET DIRECTLY
 * Session tokens are verified with plain JWT_SECRET by verifyToken
 * (src/lib/auth.ts) and by proxy.ts, and both accept a token from an
 * Authorization: Bearer header. A pending token signed with the same key
 * would therefore verify as a session token if someone sent it as Bearer -
 * withAdmin would still refuse it (no role), but withAuth would treat the
 * caller as signed in. Signing with HMAC-SHA256(JWT_SECRET,
 * "tapvyo:admin-2fa-pending") makes the two token kinds mutually
 * unverifiable, while rotating JWT_SECRET still invalidates both.
 * `aud` is checked as well, as a second, independent tag.
 *
 * THE COOKIE
 * admin-2fa-pending; HttpOnly; Secure; SameSite=Lax; Max-Age=300;
 * Path=/api/admin/login - the browser sends it only to the two login
 * endpoints, nowhere else. It is never read by the session code.
 *
 * Nothing here logs, caches the secret, or touches the database.
 */

import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';

export const PENDING_COOKIE_NAME = 'admin-2fa-pending';
export const PENDING_AUDIENCE = '2fa-pending';
export const PENDING_COOKIE_PATH = '/api/admin/login';
export const PENDING_TTL_SECONDS = 300;

const PENDING_PURPOSE = '2fa-pending';

/** HMAC-SHA256(JWT_SECRET, "tapvyo:admin-2fa-pending"). Read on every call, never cached. */
function derivedKey(): Buffer {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    // Same failure the session code has without JWT_SECRET: refuse, never sign
    // with an empty or fallback key.
    throw new Error('JWT_SECRET is not set');
  }
  return createHmac('sha256', secret).update('tapvyo:admin-2fa-pending').digest();
}

/** A 5-minute pending token for this admin. */
export function mintPendingToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: PENDING_PURPOSE }, derivedKey(), {
    algorithm: 'HS256',
    audience: PENDING_AUDIENCE,
    expiresIn: PENDING_TTL_SECONDS,
  });
}

/**
 * The admin id from a pending token, or { ok: false } for anything else -
 * expired, wrong key (including a session token), wrong audience or
 * purpose, malformed. Never throws.
 */
export function verifyPendingToken(token: string | undefined | null): { ok: true; userId: string } | { ok: false } {
  if (!token) return { ok: false };
  try {
    const payload = jwt.verify(token, derivedKey(), {
      algorithms: ['HS256'],
      audience: PENDING_AUDIENCE,
    });
    if (
      typeof payload !== 'object' ||
      payload === null ||
      payload.purpose !== PENDING_PURPOSE ||
      typeof payload.sub !== 'string' ||
      !payload.sub
    ) {
      return { ok: false };
    }
    return { ok: true, userId: payload.sub };
  } catch {
    return { ok: false };
  }
}

function serialize(value: string, maxAge: number): string {
  const parts = [
    `${PENDING_COOKIE_NAME}=${value}`,
    `Path=${PENDING_COOKIE_PATH}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];
  // An explicit past Expires as well, for clients that ignore Max-Age=0.
  if (maxAge === 0) parts.splice(3, 0, 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return parts.join('; ');
}

/** Set-Cookie value carrying a pending token. */
export function buildPendingCookie(token: string): string {
  return serialize(token, PENDING_TTL_SECONDS);
}

/** Set-Cookie value that deletes the pending cookie (same name, path and flags). */
export function buildPendingCookieClear(): string {
  return serialize('', 0);
}
