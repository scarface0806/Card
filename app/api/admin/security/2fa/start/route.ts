import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/responses";
import { MongoRateLimitUnavailableError } from "@/lib/mongo-rate-limit";
import { encryptSecret, TwoFactorConfigError } from "@/lib/two-factor-crypto";
import { buildOtpauthUrl, consumeLimiter, generateTotpSecret } from "@/lib/two-factor";

/**
 * POST /api/admin/security/2fa/start -> { otpauthUrl, secretPreview }
 *
 * Begins (or restarts) enrolment: a fresh 20-byte secret is generated,
 * stored ENCRYPTED in twoFactorSecret, and returned once - as the QR link
 * and as plain base32 for typing in by hand. 2FA stays OFF until
 * /2fa/confirm sees a valid code, so an abandoned enrolment changes nothing.
 *
 * REFUSED WHEN 2FA IS ALREADY ON (409). Otherwise anyone holding a stolen
 * admin session could call this to overwrite the secret and switch 2FA off
 * without the password or a code. Turning 2FA off is Step 5's disable
 * route, which requires both. The 409 body is deliberately only
 * { enabled, message } - nothing about the current secret.
 *
 * Same admin guard as /api/admin/security/password. Never logs the secret.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const rl = await consumeLimiter("2fa-start", `admin:${user.id}`, [
      { name: "m", windowMs: 60_000, limit: 5 },
      { name: "h", windowMs: 3_600_000, limit: 20 },
    ]);
    if (!rl.ok) {
      const res = errorResponse("Too many requests. Please try again later.", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, twoFactorEnabled: true },
    });
    if (!dbUser) {
      return errorResponse("Admin access required", 403);
    }

    if (dbUser.twoFactorEnabled === true) {
      return NextResponse.json(
        { enabled: true, message: "2FA is already enabled. Disable it first." },
        { status: 409 }
      );
    }

    const secret = generateTotpSecret();

    // Encrypt BEFORE anything is written; a missing key throws
    // TwoFactorConfigError here and nothing is stored.
    const encrypted = encryptSecret(secret);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        twoFactorSecret: encrypted,
        twoFactorEnabled: false,
        twoFactorLastUsedStep: null,
      },
    });

    return NextResponse.json({
      otpauthUrl: buildOtpauthUrl("Tapvyo", dbUser.email, secret),
      secretPreview: secret,
    });
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError || error instanceof TwoFactorConfigError) {
      return errorResponse("Authentication service unavailable. Please try again shortly.", 503);
    }
    return errorResponse("Failed to start 2FA enrolment", 500);
  }
}
