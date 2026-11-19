import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/responses";
import { MongoRateLimitUnavailableError } from "@/lib/mongo-rate-limit";
import { decryptSecret, TwoFactorConfigError, TwoFactorDecryptError } from "@/lib/two-factor-crypto";
import { consumeLimiter, generateBackupCodes, hashBackupCodes, verifyTotp } from "@/lib/two-factor";

const bodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/**
 * POST /api/admin/security/2fa/confirm  { code } -> { ok: true, backupCodes }
 *
 * Finishes enrolment: the first code from the authenticator app proves the
 * secret was saved correctly. Only then is 2FA switched on.
 *
 *  - 10 backup codes are generated and returned in PLAIN TEXT, ONCE - only
 *    their bcrypt hashes are stored, and no route ever returns them again.
 *  - twoFactorLastUsedStep is set to the step this code matched, NOT null,
 *    so the same code cannot be replayed at the two-step login (Step 4).
 *
 * Errors are generic. Same admin guard as /api/admin/security/password.
 * Nothing here logs the secret or the codes.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const rl = await consumeLimiter("2fa-confirm", `admin:${user.id}`, [
      { name: "m", windowMs: 60_000, limit: 10 },
      { name: "h", windowMs: 3_600_000, limit: 30 },
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
      return NextResponse.json({ ok: false, message: "Invalid code" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Invalid code" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorLastUsedStep: true,
      },
    });
    if (!dbUser) {
      return errorResponse("Admin access required", 403);
    }

    if (dbUser.twoFactorEnabled === true) {
      return NextResponse.json(
        { enabled: true, message: "2FA is already enabled." },
        { status: 409 }
      );
    }

    if (!dbUser.twoFactorSecret) {
      return NextResponse.json(
        { ok: false, message: "Start 2FA enrolment first." },
        { status: 400 }
      );
    }

    const secret = decryptSecret(dbUser.twoFactorSecret);
    const result = verifyTotp(secret, parsed.data.code, dbUser.twoFactorLastUsedStep);
    if (!result.ok || result.step === null) {
      return NextResponse.json({ ok: false, message: "Invalid code" }, { status: 400 });
    }

    const backupCodes = generateBackupCodes(10);
    const hashes = await hashBackupCodes(backupCodes);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashes,
        twoFactorLastUsedStep: result.step,
      },
    });

    return NextResponse.json({ ok: true, backupCodes });
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError || error instanceof TwoFactorConfigError) {
      return errorResponse("Authentication service unavailable. Please try again shortly.", 503);
    }
    if (error instanceof TwoFactorDecryptError) {
      return errorResponse("Failed to confirm 2FA. Please start enrolment again.", 500);
    }
    return errorResponse("Failed to confirm 2FA", 500);
  }
}
