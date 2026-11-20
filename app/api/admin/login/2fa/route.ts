import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { consumeRateLimit, MongoRateLimitUnavailableError, type RateWindow } from "@/lib/mongo-rate-limit";
import { getClientIp } from "@/lib/track-order-rate-limit";
import { decryptSecret, TwoFactorConfigError } from "@/lib/two-factor-crypto";
import { verifyBackupCode, verifyTotp } from "@/lib/two-factor";
import {
  buildPendingCookieClear,
  PENDING_COOKIE_NAME,
  verifyPendingToken,
} from "@/lib/admin-2fa-pending";
import { issueAdminSession } from "@/lib/admin-session";

/**
 * POST /api/admin/login/2fa  { code }  - the second step of admin login.
 *
 * Needs the 5-minute admin-2fa-pending cookie that /api/admin/login sets
 * after a correct password (src/lib/admin-2fa-pending.ts) AND a valid
 * 6-digit authenticator code or an unused backup code. Only then is the
 * real session issued - the same cookies and the same body a no-2FA admin
 * gets from the password route (src/lib/admin-session.ts).
 *
 * ORDER MATTERS
 *  1. Per-IP limit, BEFORE the cookie is read: requests with missing or
 *     forged cookies are limited too.
 *  2. Pending cookie. Bad -> generic 401 and the cookie is cleared.
 *  3. Per-admin limit (the cookie names the admin). Over -> 429; the
 *     cookie is kept, so the admin can retry once the window passes.
 *  4-6. Body, user, code.
 *  7. Session.
 *
 * ONE ANSWER FOR EVERY FAILURE: 401 "Invalid code" - wrong code, replayed
 * code, used backup code, expired or missing cookie, inactive account,
 * 2FA switched off mid-login. Only the limiter has its own 429 message,
 * matching the password route.
 *
 * SINGLE USE, EVEN UNDER RACES
 *  - TOTP: the step a code matched must be strictly newer than
 *    twoFactorLastUsedStep, and the update is a compare-and-set
 *    (updateMany where the stored step is older); count !== 1 means another
 *    request already used that step -> 401.
 *  - Backup codes: compare-and-set on the WHOLE array. A filter on just the
 *    used hash is not enough - two requests spending two different codes at
 *    once would each write back their own snapshot and the second would
 *    restore the code the first one spent.
 *
 * Nothing here logs the code, the secret, the pending token or any 2FA data.
 */

const IP_LIMIT: readonly RateWindow[] = [{ name: "minute", windowMs: 60_000, limit: 5 }];
const USER_LIMIT: readonly RateWindow[] = [{ name: "minute", windowMs: 60_000, limit: 5 }];

const INVALID = "Invalid code";
const TOO_MANY = "Too many login attempts. Please try again later.";

const bodySchema = z.object({ code: z.string().trim().min(1).max(32) });

function invalid(clearPending: boolean) {
  const res = NextResponse.json({ success: false, message: INVALID, error: INVALID }, { status: 401 });
  if (clearPending) res.headers.append("Set-Cookie", buildPendingCookieClear());
  return res;
}

function tooMany(retryAfter?: number) {
  const res = NextResponse.json({ success: false, message: TOO_MANY, error: TOO_MANY }, { status: 429 });
  if (retryAfter) res.headers.set("Retry-After", String(retryAfter));
  return res;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Per-IP limit, before anything else is looked at.
    const ipCheck = await consumeRateLimit("admin-login-2fa-ip", getClientIp(request.headers), IP_LIMIT);
    if (!ipCheck.ok) return tooMany(ipCheck.retryAfter);

    // 2. The pending cookie from the password step.
    const pending = verifyPendingToken(request.cookies.get(PENDING_COOKIE_NAME)?.value);
    if (!pending.ok) return invalid(true);
    const userId = pending.userId;

    // 3. Per-admin limit.
    const userCheck = await consumeRateLimit("admin-login-2fa-user", userId, USER_LIMIT);
    if (!userCheck.ok) return tooMany(userCheck.retryAfter);

    // 4. Body.
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return invalid(false);
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return invalid(false);
    const code = parsed.data.code;

    // 5. The admin, re-read now: the account may have changed since step one.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        twoFactorLastUsedStep: true,
      },
    });
    if (
      !user ||
      user.isActive === false ||
      user.role !== Role.ADMIN ||
      user.twoFactorEnabled !== true ||
      !user.twoFactorSecret
    ) {
      return invalid(true);
    }

    // 6. The code.
    if (/^\d{6}$/.test(code)) {
      const result = verifyTotp(decryptSecret(user.twoFactorSecret), code, user.twoFactorLastUsedStep);
      if (!result.ok || result.step === null) return invalid(false);

      const claimed = await prisma.user.updateMany({
        where: {
          id: user.id,
          twoFactorEnabled: true,
          OR: [
            { twoFactorLastUsedStep: { isSet: false } },
            { twoFactorLastUsedStep: null },
            { twoFactorLastUsedStep: { lt: result.step } },
          ],
        },
        data: { twoFactorLastUsedStep: result.step },
      });
      if (claimed.count !== 1) return invalid(false);
    } else {
      const snapshot = user.twoFactorBackupCodes ?? [];
      const match = await verifyBackupCode(code, snapshot);
      if (!match.ok) return invalid(false);

      const claimed = await prisma.user.updateMany({
        where: { id: user.id, twoFactorEnabled: true, twoFactorBackupCodes: { equals: snapshot } },
        data: { twoFactorBackupCodes: { set: snapshot.filter((_, i) => i !== match.index) } },
      });
      if (claimed.count !== 1) return invalid(false);
    }

    // 7. The real session - identical to a no-2FA password login.
    const { cookies, body } = await issueAdminSession(user);
    const response = NextResponse.json(body, { status: 200 });
    for (const cookie of cookies) response.headers.append("Set-Cookie", cookie);
    response.headers.append("Set-Cookie", buildPendingCookieClear());
    return response;
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError || error instanceof TwoFactorConfigError) {
      const msg = "Authentication service unavailable. Please try again shortly.";
      return NextResponse.json({ success: false, message: msg, error: msg }, { status: 503 });
    }
    // Includes TwoFactorDecryptError. No detail - it could only echo input.
    const msg = "An internal server error occurred.";
    return NextResponse.json({ success: false, message: msg, error: msg }, { status: 500 });
  }
}
