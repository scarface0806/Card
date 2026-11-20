import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/responses';
import { createHash } from 'node:crypto';
import {
  consumeRateLimit,
  MongoRateLimitUnavailableError,
  peekRateLimit,
  resetRateLimit,
  type RateWindow,
} from '@/lib/mongo-rate-limit';
import { getClientIp } from '@/lib/track-order-rate-limit';
import { buildPendingCookie, mintPendingToken } from '@/lib/admin-2fa-pending';
import { Role } from '@prisma/client';

/**
 * ADMIN LOGIN LIMITS - shared across every serverless instance.
 *
 * This route used checkRateLimit (src/lib/rate-limit.ts), which counts in a
 * per-process Map. On Vercel each instance has its own Map, so spreading
 * guesses across instances multiplied the "5 per minute" by the number of
 * warm instances, and there was no lockout at all. These counters live in the
 * MongoDB `rate_limits` collection (src/lib/mongo-rate-limit.ts), which every
 * instance shares, and expire through its TTL index.
 *
 * Attempts (every request counts):
 *  - 5 / minute per IP, checked before the body is read, as before.
 *  - 5 / minute per account email.
 * Lockout (only FAILED attempts count, checked before the password is):
 *  - 10 failures / 15 min per email + IP pair.
 *  - 30 failures / 15 min per email from ALL IPs - stops a slow attack spread
 *    over many addresses.
 * The pair key is what a normal attacker hits. Locking by email alone at 10
 * would let anyone who knows the admin's address keep the real admin locked
 * out by sending 10 wrong passwords every 15 minutes; the email-wide cap is
 * high enough that this takes a deliberate, many-IP effort.
 *
 * Emails are SHA-256 hashed in the keys, so no address sits in rate_limits,
 * and an unknown email is keyed and limited exactly like a real one.
 */
const ATTEMPTS_PER_MINUTE: readonly RateWindow[] = [
  { name: 'minute', windowMs: 60 * 1000, limit: 5 },
];
const PAIR_LOCKOUT: readonly RateWindow[] = [
  { name: 'lockout', windowMs: 15 * 60 * 1000, limit: 10 },
];
const EMAIL_LOCKOUT: readonly RateWindow[] = [
  { name: 'lockout', windowMs: 15 * 60 * 1000, limit: 30 },
];

/** One message for every limit and lockout: it must not reveal whether the email exists. */
const TOO_MANY_ATTEMPTS = 'Too many login attempts. Please try again later.';

function hashEmail(email: string): string {
  return createHash('sha256').update(email).digest('hex');
}

function tooManyAttempts(retryAfter?: number) {
  const res = errorResponse(TOO_MANY_ATTEMPTS, 429);
  if (retryAfter) res.headers.set('Retry-After', String(retryAfter));
  return res;
}

const REQUIRED_AUTH_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'] as const;
const missingAuthEnvVars = REQUIRED_AUTH_ENV_VARS.filter(
  (name) => !process.env[name]?.trim()
);

if (missingAuthEnvVars.length > 0) {
  console.error(
    `[Auth] Missing environment variables at server startup: ${missingAuthEnvVars.join(', ')}`
  );
}

function sanitizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function sanitizePassword(password: unknown): string {
  return typeof password === 'string' ? password : '';
}

function isDatabaseConnectivityError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    message?: string;
    name?: string;
    code?: string | number;
  };

  const message = (candidate.message || '').toLowerCase();
  const name = (candidate.name || '').toLowerCase();
  const code = String(candidate.code || '').toLowerCase();

  return (
    message.includes('server selection timeout') ||
    message.includes('failed to connect') ||
    message.includes('authentication failed') ||
    code === 'p1001' ||
    code === 'p1002' ||
    name.includes('prismaclientinitializationerror')
  );
}

function createAdminSuccessResponse(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
}) {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return createAuthResponse(token, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      console.error('[Admin Auth] Missing DATABASE_URL');
      return errorResponse(
        'Authentication service misconfigured. Please check environment variables.',
        500
      );
    }

    if (!process.env.JWT_SECRET?.trim()) {
      console.error('[Admin Auth] Missing JWT_SECRET');
      return errorResponse(
        'Authentication service misconfigured. Please check environment variables.',
        500
      );
    }

    /**
     * BRUTE-FORCE GUARD. This route had none.
     *
     * /api/auth/login (the customer one) has been rate limited all along, but
     * this endpoint - the one that grants ADMIN role and the whole dashboard -
     * accepted unlimited password attempts from a single IP. That is the most
     * valuable door on the site and it was the only unlocked one.
     *
     * The limit is 5 per minute, tighter than the customer login's 10: nobody
     * legitimately mistypes an admin password five times a minute, and the
     * cost of a wrong guess here is the entire database.
     *
     * Checked BEFORE the body is parsed, so a flood cannot make us do work.
     *
     * Now the SHARED limiter (see ADMIN LOGIN LIMITS at the top of this file):
     * the per-instance Map it replaced could be outrun by spreading requests
     * across Vercel instances.
     */
    const ip = getClientIp(request.headers);
    const ipCheck = await consumeRateLimit('admin-login-ip', ip, ATTEMPTS_PER_MINUTE);
    if (!ipCheck.ok) {
      return tooManyAttempts(ipCheck.retryAfter);
    }

    let body: { email?: unknown; password?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid request body. Please send valid JSON.', 400);
    }

    const normalizedEmail = sanitizeEmail(body.email);
    const email = normalizedEmail;
    const password = sanitizePassword(body.password);

    if (!normalizedEmail) {
      return errorResponse('Email is required.', 400);
    }

    if (!password) {
      return errorResponse('Password is required.', 400);
    }

    // Per-account limits, BEFORE the database lookup and the password check,
    // and identical for emails that do not exist - the 429 cannot be used to
    // learn which addresses are real.
    const emailKey = hashEmail(normalizedEmail);
    const pairKey = `${emailKey}:${ip}`;

    const emailCheck = await consumeRateLimit('admin-login-email', emailKey, ATTEMPTS_PER_MINUTE);
    if (!emailCheck.ok) {
      return tooManyAttempts(emailCheck.retryAfter);
    }

    const [pairLock, emailLock] = await Promise.all([
      peekRateLimit('admin-login-fail-pair', pairKey, PAIR_LOCKOUT),
      peekRateLimit('admin-login-fail-email', emailKey, EMAIL_LOCKOUT),
    ]);
    if (!pairLock.ok || !emailLock.ok) {
      return tooManyAttempts(Math.max(pairLock.retryAfter ?? 0, emailLock.retryAfter ?? 0) || undefined);
    }

    // Every failed attempt below is recorded against both lockout counters
    // BEFORE its (unchanged) response is returned.
    const recordFailure = () =>
      Promise.all([
        consumeRateLimit('admin-login-fail-pair', pairKey, PAIR_LOCKOUT),
        consumeRateLimit('admin-login-fail-email', emailKey, EMAIL_LOCKOUT),
      ]);

    // Use Prisma (not direct MongoDB client) — more reliable connection on serverless
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      await recordFailure();
      return errorResponse('User not found', 404);
    }

    if (user.isActive === false) {
      await recordFailure();
      return errorResponse('Account has been deactivated', 403);
    }

    if (user.role !== Role.ADMIN) {
      await recordFailure();
      return errorResponse('You are not authorized to access admin portal', 403);
    }

    if (!user.password) {
      await recordFailure();
      return errorResponse('Invalid password', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await recordFailure();
      return errorResponse('Invalid password', 401);
    }

    // A correct password clears this email + IP's failures, so the admin's own
    // earlier typos do not count toward a later lockout. The email-wide counter
    // is deliberately NOT cleared: an attacker spraying from many IPs must not
    // get a fresh allowance every time the real admin signs in.
    await resetRateLimit('admin-login-fail-pair', pairKey, PAIR_LOCKOUT);

    // TWO-STEP LOGIN. With 2FA on, a correct password is only half the proof:
    // issue a 5-minute pending cookie (src/lib/admin-2fa-pending.ts) and NO
    // session. /api/admin/login/2fa issues the session after a valid code.
    // Admins without 2FA fall through to the unchanged success path below.
    if (user.twoFactorEnabled === true) {
      const pending = NextResponse.json({ requires2fa: true }, { status: 200 });
      pending.headers.append('Set-Cookie', buildPendingCookie(mintPendingToken(user.id)));
      return pending;
    }

    return createAdminSuccessResponse({
      id: user.id,
      email: user.email,
      name: user.name || 'Admin User',
      role: Role.ADMIN,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
    });
  } catch (error) {
    // Fail closed: without the shared counters there is no brute-force limit,
    // so no login is attempted at all.
    if (error instanceof MongoRateLimitUnavailableError) {
      console.error('[Admin Auth] Rate limiter unavailable; refusing login:', error.message);
      return errorResponse('Authentication service unavailable. Please try again shortly.', 503);
    }

    if (isDatabaseConnectivityError(error)) {
      console.error('[Admin Auth] Database connectivity error during login:', error);
      return errorResponse('Database service unavailable. Please try again shortly.', 503);
    }

    console.error('[Admin Auth] Fatal error during login:', error);
    return errorResponse('An internal server error occurred.', 500);
  }
}
interface AuthResponseUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
}

function createAuthResponse(token: string, userData: AuthResponseUser) {
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

  return response;
}
