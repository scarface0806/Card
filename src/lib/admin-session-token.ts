/**
 * Admin session JWT with the 2FA claim. SERVER-ONLY (jsonwebtoken).
 *
 * generateToken (src/lib/auth.ts) signs { userId, email, role } only. Admin
 * sessions also carry twoFactorEnabled so ADMIN_2FA_REQUIRED can be enforced
 * in proxy.ts and withAdmin() without a database query per request
 * (src/lib/admin-2fa-enforcement.ts).
 *
 * Signed exactly like generateToken - same secret (getJwtSecretOrThrow), HS256
 * (jsonwebtoken's default), same JWT_EXPIRES_IN fallback - so verifyToken and
 * proxy.ts's jose verifyJWT accept it: the claims are a superset.
 *
 * Every admin session is minted here: the password login (no-2FA admins), the
 * 2FA login (src/lib/admin-session.ts), and the re-issue after 2FA is
 * confirmed or disabled, so the claim never stays stale for the session's life.
 */

import jwt from 'jsonwebtoken';
import { NextResponse, type NextRequest } from 'next/server';
import type { Role } from '@prisma/client';

import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { getJwtSecretOrThrow } from '@/lib/env';

export interface AdminTokenUser {
  id: string;
  email: string;
  role: Role;
  twoFactorEnabled?: boolean | null;
}

export function mintAdminSessionToken(user: AdminTokenUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled === true,
    },
    getJwtSecretOrThrow(),
    {
      algorithm: 'HS256',
      // Read per call; `||` (not `??`) so an empty value falls back like generateToken.
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    }
  );
}

/**
 * Set-Cookie strings for the three session cookies, built with the same
 * options as createAuthResponse in app/api/admin/login/route.ts and
 * src/lib/admin-session.ts (httpOnly, secure in production, lax, 7 days, /).
 */
export function adminSessionCookieHeaders(token: string): string[] {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
  const res = new NextResponse(null);
  res.cookies.set('auth-token', token, options);
  res.cookies.set('admin-token', token, options);
  res.cookies.set('token', token, options);
  return res.headers.getSetCookie();
}

/** Re-issue the session on `response` with the given 2FA state. */
export function reissueAdminSession(response: NextResponse, user: AdminTokenUser): NextResponse {
  for (const cookie of adminSessionCookieHeaders(mintAdminSessionToken(user))) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

/**
 * The verified claims of the request's session token, picked in the same
 * order as authenticate() (Bearer, then auth-token / admin-token / token), so
 * withAdmin() checks the very token it just authenticated. No DB query.
 */
export function sessionClaimsFromRequest(
  request: NextRequest
): { role?: unknown; twoFactorEnabled?: unknown } | null {
  const token =
    extractTokenFromHeader(request.headers.get('authorization')) ||
    request.cookies.get('auth-token')?.value ||
    request.cookies.get('admin-token')?.value ||
    request.cookies.get('token')?.value ||
    null;
  if (!token) return null;
  // verifyToken returns the whole decoded payload; its type just omits the claim.
  return verifyToken(token) as { role?: unknown; twoFactorEnabled?: unknown } | null;
}
