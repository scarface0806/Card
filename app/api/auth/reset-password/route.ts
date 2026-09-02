import { NextRequest } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { hashPassword, isStrongPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import {
  consumeResetToken,
  findValidResetToken,
  setUserPasswordHash,
} from "@/lib/password-reset";

/**
 * POST /api/auth/reset-password
 *
 * Completes the flow started by /api/auth/forgot-password.
 *
 * A bad token, an expired token and an already-used token all produce ONE
 * message. Telling them apart would let someone with a stale link learn that
 * it was once valid, and confirm the account exists.
 *
 * The new password is hashed with the same bcrypt cost as registration (see
 * src/lib/auth.ts) and the plaintext is never logged. On success every other
 * outstanding reset token for that user is invalidated, so a link that reached
 * a compromised inbox stops working.
 *
 * No session is issued here. The user is sent to /login to sign in with the
 * new password, which means possession of a reset link alone never grants a
 * logged-in session.
 */

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

/** One message for every way a token can fail to be usable. */
const INVALID_TOKEN_MESSAGE =
  "This password reset link is invalid or has expired. Please request a new one.";

export async function POST(request: NextRequest) {
  try {
    const rateCheck = checkRateLimit(request, 10);
    if (!rateCheck.ok) {
      const res = errorResponse(
        "Too many attempts. Please try again in a minute.",
        429
      );
      if (rateCheck.retryAfter) {
        res.headers.set("Retry-After", String(rateCheck.retryAfter));
      }
      return res;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body. Please send valid JSON.", 400);
    }

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(INVALID_TOKEN_MESSAGE, 400);
    }

    const { token, password } = parsed.data;

    // Password strength is checked BEFORE the token is consumed. Failing
    // afterwards would burn the single-use link and force the user to request
    // a new email just because their password was too short.
    const strength = isStrongPassword(password);
    if (!strength.valid) {
      return errorResponse(
        strength.message || "Please choose a stronger password.",
        400
      );
    }

    const resetRow = await findValidResetToken(token);
    if (!resetRow) {
      return errorResponse(INVALID_TOKEN_MESSAGE, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: resetRow.userId },
      select: { id: true, email: true, isActive: true },
    });

    // The account could have been deleted or deactivated between the request
    // and the reset. Same generic message - the token is simply not usable.
    if (!user || !user.isActive) {
      return errorResponse(INVALID_TOKEN_MESSAGE, 400);
    }

    const hashed = await hashPassword(password);

    /**
     * ORDER MATTERS, AND THIS ORDER IS DELIBERATE: burn the token FIRST, then
     * write the password.
     *
     * The reverse reads more naturally - don't invalidate the link until the
     * work succeeded - and it is what this route did first. It is wrong. If
     * the consume step then fails for any reason, the password has already
     * changed and the reset link is still live, so the link keeps working as a
     * standing key to an account whose password has already been reset. That
     * was reproduced here: a replayed link successfully set the password a
     * second time.
     *
     * This way round, the worst case is a burnt token and an unchanged
     * password - the customer requests another link. Annoying, not dangerous.
     */
    await consumeResetToken(resetRow.id, user.id);

    await setUserPasswordHash(user.id, hashed);

    // Email only - never the password, and never the token.
    console.info(`[Auth] Password reset completed for ${user.email}`);

    return successResponse(
      {
        message:
          "Your password has been reset. You can now log in with your new password.",
      },
      200
    );
  } catch (error) {
    console.error(
      "[Auth] Reset password error:",
      error instanceof Error ? error.message : String(error)
    );
    return errorResponse(
      "We could not reset your password. Please request a new link.",
      500
    );
  }
}
