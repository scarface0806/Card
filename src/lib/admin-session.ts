/**
 * The full admin session, for /api/admin/login/2fa. SERVER-ONLY.
 *
 * A deliberate COPY of createAdminSuccessResponse + createAuthResponse in
 * app/api/admin/login/route.ts, which stay where they are (that route may
 * only change its success branch, and route files cannot export helpers).
 * After a correct second factor the admin must end up with EXACTLY the
 * session a no-2FA admin gets from the password route:
 *
 *   JWT    generateToken({ userId, email, role })  (JWT_EXPIRES_IN, 7d)
 *   body   successResponse({ message: 'Login successful', user, token, success: true })
 *   cookies auth-token, admin-token, token - httpOnly, secure in production,
 *          sameSite=lax, maxAge 7 days, path /
 *
 * tests/two-factor-login.test.ts compares this against the real password
 * route's response (cookie names + attributes, body keys) so the two cannot
 * drift apart silently. Change both together, or neither.
 */

import { Role } from '@prisma/client';

import { generateToken } from '@/lib/auth';
import { successResponse } from '@/lib/responses';

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
}

export async function issueAdminSession(
  user: AdminSessionUser
): Promise<{ cookies: string[]; body: Record<string, unknown> }> {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name || 'Admin User',
    role: user.role,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
  };

  // Built with the same helper and options as createAuthResponse, then read
  // back, so the body and Set-Cookie strings are produced by identical code.
  const response = successResponse({
    message: 'Login successful',
    user: userData,
    token,
    success: true,
  }, 200);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };

  response.cookies.set('auth-token', token, cookieOptions);
  response.cookies.set('admin-token', token, cookieOptions);
  response.cookies.set('token', token, cookieOptions);

  return {
    cookies: response.headers.getSetCookie(),
    body: (await response.json()) as Record<string, unknown>,
  };
}
