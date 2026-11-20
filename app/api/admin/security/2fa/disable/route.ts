import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/responses";
import { consumeRateLimit, MongoRateLimitUnavailableError, type RateWindow } from "@/lib/mongo-rate-limit";
import { decryptSecret, TwoFactorConfigError } from "@/lib/two-factor-crypto";
import { verifyBackupCode, verifyTotp } from "@/lib/two-factor";
import { buildPendingCookieClear } from "@/lib/admin-2fa-pending";
import { reissueAdminSession } from "@/lib/admin-session-token";

/**
 * POST /api/admin/security/2fa/disable  { password, code }
 *
 * Turns 2FA off for the signed-in admin. A stolen session alone is NOT
 * enough: it needs the account password AND a current authenticator code or
 * an unused backup code - the same proof the two-step login asks for.
 *
 * On success every 2FA field is cleared (enabled, secret, backup-code hashes,
 * last used step), so re-enabling starts a fresh enrolment.
 *
 * RACE WITH A PASSWORD CHANGE: the final write is a compare-and-set on the
 * password hash that was just verified. If the password changed in between,
 * nothing is written and the caller gets 409 "Please retry".
 *
 * Messages: "Invalid password" and "Invalid code" are separate, matching the
 * password-change route; everything else is generic. Nothing is logged.
 * Same admin guard as the other /api/admin/security routes.
 */

const LIMIT: readonly RateWindow[] = [{ name: "15m", windowMs: 15 * 60_000, limit: 5 }];

const bodySchema = z.object({
  password: z.string().min(1).max(200),
  code: z.string().trim().min(1).max(32),
});

function reply(status: number, success: boolean, message: string, extraHeaders?: Record<string, string>) {
  const res = NextResponse.json(
    success ? { success: true, message } : { success: false, message, error: message },
    { status }
  );
  // In case a pending cookie from an unfinished login is still around.
  res.headers.append("Set-Cookie", buildPendingCookieClear());
  for (const [name, value] of Object.entries(extraHeaders ?? {})) res.headers.set(name, value);
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    // a. Rate limit per admin.
    const rl = await consumeRateLimit("admin-2fa-disable", user.id, LIMIT);
    if (!rl.ok) {
      return reply(429, false, "Too many attempts. Please try again later.",
        rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined);
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return reply(400, false, "Invalid request");
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return reply(400, false, "Invalid request");
    }

    // b. The admin.
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        twoFactorLastUsedStep: true,
      },
    });
    if (!dbUser) {
      return errorResponse("Admin access required", 403);
    }

    // c. Already off: nothing to do.
    if (dbUser.twoFactorEnabled !== true) {
      return reply(200, true, "2FA is already disabled");
    }

    // d. Password.
    const passwordOk = dbUser.password
      ? await bcrypt.compare(parsed.data.password, dbUser.password)
      : false;
    if (!passwordOk || !dbUser.password) {
      return reply(401, false, "Invalid password");
    }

    // e. Code: a fresh TOTP (newer than the last one used) or a backup code.
    const code = parsed.data.code;
    let codeOk = false;
    if (/^\d{6}$/.test(code)) {
      codeOk = dbUser.twoFactorSecret
        ? verifyTotp(decryptSecret(dbUser.twoFactorSecret), code, dbUser.twoFactorLastUsedStep).ok
        : false;
    } else {
      codeOk = (await verifyBackupCode(code, dbUser.twoFactorBackupCodes ?? [])).ok;
    }
    if (!codeOk) {
      return reply(401, false, "Invalid code");
    }

    // f. Clear everything - only if 2FA is still on AND the password is the
    // one just verified.
    const cleared = await prisma.user.updateMany({
      where: { id: dbUser.id, twoFactorEnabled: true, password: dbUser.password },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: { set: [] },
        twoFactorLastUsedStep: null,
      },
    });
    if (cleared.count !== 1) {
      return reply(409, false, "Please retry");
    }

    // g. Done. Same body; the session cookies are re-issued so the token's
    // twoFactorEnabled claim (ADMIN_2FA_REQUIRED) is false from now on.
    return reissueAdminSession(reply(200, true, "2FA disabled"), {
      id: dbUser.id,
      email: dbUser.email,
      role: user.role,
      twoFactorEnabled: false,
    });
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError || error instanceof TwoFactorConfigError) {
      return reply(503, false, "Authentication service unavailable. Please try again shortly.");
    }
    return reply(500, false, "Failed to disable 2FA");
  }
}
