import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/responses";
import { MongoRateLimitUnavailableError } from "@/lib/mongo-rate-limit";
import { consumeLimiter } from "@/lib/two-factor";

/**
 * GET /api/admin/security/2fa/status -> { enabled: boolean }
 *
 * Lets the Security page know which state to show. Returns that one boolean
 * and nothing else - no secret, no codes, no other account fields - and the
 * user row is loaded with an explicit select so nothing extra can leak in.
 *
 * Same admin guard as /api/admin/security/password.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const rl = await consumeLimiter("2fa-status", `admin:${user.id}`, [
      { name: "m", windowMs: 60_000, limit: 30 },
    ]);
    if (!rl.ok) {
      const res = errorResponse("Too many requests. Please try again later.", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });

    return NextResponse.json({ enabled: dbUser?.twoFactorEnabled === true });
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError) {
      return errorResponse("Authentication service unavailable. Please try again shortly.", 503);
    }
    return errorResponse("Failed to load 2FA status", 500);
  }
}
