import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { verifyPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/responses";
import { MongoRateLimitUnavailableError } from "@/lib/mongo-rate-limit";
import { decryptSecret, TwoFactorConfigError, TwoFactorDecryptError } from "@/lib/two-factor-crypto";
import {
  consumeLimiter,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  verifyTotp,
} from "@/lib/two-factor";

const bodySchema = z.object({
  password: z.string().min(1),
  code: z.string().min(6).max(20),
});

/** One message for every credential failure: it must not say which part was wrong. */
const INVALID = "Invalid password or code";

/**
 * POST /api/admin/security/2fa/backup-codes/regenerate  { password, code }
 *   -> { ok: true, backupCodes }
 *
 * Replaces ALL backup codes with 10 new ones, returned in plain text ONCE.
 * Needs the account password AND either a fresh authenticator code or one
 * of the current backup codes - a stolen session alone is not enough.
 *
 * A TOTP code is accepted only if its time-step is strictly after
 * twoFactorLastUsedStep (the code used to confirm enrolment, or the last
 * regenerate, cannot be replayed); the new step is then stored.
 *
 * Same admin guard as /api/admin/security/password. Nothing is logged.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const rl = await consumeLimiter("2fa-regen", `admin:${user.id}`, [
      { name: "m", windowMs: 60_000, limit: 5 },
      { name: "h", windowMs: 3_600_000, limit: 15 },
    ]);
    if (!rl.ok) {
      const res = errorResponse("Too many requests. Please try again later.", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, message: INVALID }, { status: 401 });
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: INVALID }, { status: 401 });
    }

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

    if (dbUser.twoFactorEnabled !== true || !dbUser.twoFactorSecret) {
      return NextResponse.json({ ok: false, message: "2FA is not enabled." }, { status: 400 });
    }

    const passwordOk = dbUser.password
      ? await verifyPassword(parsed.data.password, dbUser.password)
      : false;
    if (!passwordOk) {
      return NextResponse.json({ ok: false, message: INVALID }, { status: 401 });
    }

    // Either a fresh TOTP code (newer than the last one used) ...
    const code = parsed.data.code.trim();
    const secret = decryptSecret(dbUser.twoFactorSecret);
    const totp = verifyTotp(secret, code, dbUser.twoFactorLastUsedStep);

    // ... or one of the current backup codes.
    const backup = totp.ok
      ? { ok: false, index: -1 }
      : await verifyBackupCode(code, dbUser.twoFactorBackupCodes ?? []);

    if (!totp.ok && !backup.ok) {
      return NextResponse.json({ ok: false, message: INVALID }, { status: 401 });
    }

    const backupCodes = generateBackupCodes(10);
    const hashes = await hashBackupCodes(backupCodes);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        // Replaces every old code, including the one just used (if any).
        twoFactorBackupCodes: hashes,
        ...(totp.ok && totp.step !== null ? { twoFactorLastUsedStep: totp.step } : {}),
      },
    });

    return NextResponse.json({ ok: true, backupCodes });
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError || error instanceof TwoFactorConfigError) {
      return errorResponse("Authentication service unavailable. Please try again shortly.", 503);
    }
    if (error instanceof TwoFactorDecryptError) {
      return errorResponse("Failed to regenerate backup codes", 500);
    }
    return errorResponse("Failed to regenerate backup codes", 500);
  }
}
