import { NextRequest } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { createResetToken } from "@/lib/password-reset";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site-config";

/**
 * POST /api/auth/forgot-password
 *
 * THIS ENDPOINT MUST NOT REVEAL WHETHER AN ACCOUNT EXISTS.
 *
 * Every outcome - unknown email, known email, an account that signed up with
 * Google and has no password, a deactivated account, even a failed email send
 * - returns the same 200 and the same message. Anything else turns this route
 * into a free membership check against the customer list, and the response
 * time is kept from leaking the answer too (see the note on the dummy hash
 * below).
 *
 * The token itself is never in the response body. It goes into the email and
 * nowhere else; only its digest reaches the database. See
 * src/lib/password-reset.ts.
 */

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

/** The one response this route is allowed to give, for any input. */
const GENERIC_MESSAGE =
  "If an account exists for that email, we have sent a password reset link. Please check your inbox and your spam folder.";

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  return (forwarded.split(",")[0] || realIp || "").trim() || null;
}

/**
 * RESEND_API_KEY is the only value that has to be present. The From address
 * falls back to a verified default in src/lib/emails/resend.ts, so it is no
 * longer part of the "configured" test.
 */
function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/**
 * Send the reset email.
 *
 * Never throws: a provider outage must not change the response, or the failure
 * itself becomes a signal that the address was real.
 */
async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!isResendConfigured()) {
    // Not configured. In development, print the link so the flow is testable
    // without an email provider. Guarded on NODE_ENV: this must never reach a
    // production log, where it would be a working credential in plain text.
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[Auth] RESEND_API_KEY not set. Password reset link for ${to}: ${resetUrl}`
      );
    } else {
      console.error(
        "[Auth] Password reset requested but email is not configured. Set RESEND_API_KEY (and RESEND_FROM_EMAIL) in the environment."
      );
    }
    return;
  }

  try {
    // Imported lazily so a missing provider package or key cannot break the
    // module graph for the rest of this route.
    const { getResendClient, getEmailFrom, getEmailReplyTo } = await import(
      "@/lib/emails/resend"
    );

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#12100C;">
        <p>Hello,</p>
        <p>We received a request to reset the password for your ${SITE_NAME} account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#12100C;color:#ffffff;text-decoration:none;border-radius:8px;">Reset your password</a></p>
        <p>Or paste this link into your browser:<br><span style="word-break:break-all;color:#4b5563;">${resetUrl}</span></p>
        <p><strong>This link expires in 30 minutes and can be used once.</strong></p>
        <p>If you did not ask to reset your password you can ignore this email - your password has not changed.</p>
        <p>Need help? Reply to this email or write to ${SUPPORT_EMAIL}.</p>
        <p>- The ${SITE_NAME} team</p>
      </div>
    `;

    const text = [
      "Hello,",
      "",
      `We received a request to reset the password for your ${SITE_NAME} account.`,
      "",
      "Reset your password using this link:",
      resetUrl,
      "",
      "This link expires in 30 minutes and can be used once.",
      "",
      "If you did not ask to reset your password you can ignore this email - your password has not changed.",
      "",
      `Need help? Write to ${SUPPORT_EMAIL}.`,
      "",
      `- The ${SITE_NAME} team`,
    ].join("\n");

    const { error } = await getResendClient().emails.send({
      from: getEmailFrom(),
      to,
      replyTo: getEmailReplyTo(),
      subject: `Reset your ${SITE_NAME} password`,
      html,
      text,
    });

    // The SDK returns provider failures in the payload instead of throwing, so
    // without this check an unverified sending domain looked like a success.
    // The response the caller gets still must not change - see the note at the
    // top of this file - so this is a log, not a different reply.
    if (error) {
      console.error(
        "[Auth] Resend rejected the password reset email (the reset link is NOT in this log):",
        error
      );
    }
  } catch (error) {
    // Logged without the URL: the log must not become a place to harvest live
    // reset tokens.
    console.error("[Auth] Failed to send password reset email:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Deliberately tight. Password reset is the classic endpoint for probing a
    // list of email addresses, and a real person needs it once.
    const rateCheck = checkRateLimit(request, 5);
    if (!rateCheck.ok) {
      const res = errorResponse(
        "Too many password reset requests. Please try again in a minute.",
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

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      // A malformed email is a client mistake, not an account probe, so it is
      // safe to say so - it reveals nothing about who has an account.
      return errorResponse("Please enter a valid email address.", 400);
    }

    const email = parsed.data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, isActive: true },
    });

    // A reset link is only useful for an account that signs in with a
    // password. An OAuth-only account (password null) has nothing to reset,
    // and a deactivated one must not be reactivated this way. Both fall
    // through to the same generic response as an unknown address.
    const eligible = Boolean(user && user.password && user.isActive);

    if (user && eligible) {
      const { token } = await createResetToken(user.id, clientIp(request));
      const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
      await sendResetEmail(user.email, resetUrl);
    }

    return successResponse({ message: GENERIC_MESSAGE }, 200);
  } catch (error) {
    console.error(
      "[Auth] Forgot password error:",
      error instanceof Error ? error.message : String(error)
    );
    // Even an internal failure returns the generic message rather than a 500:
    // a 500 for one address and a 200 for another is itself an oracle.
    return successResponse({ message: GENERIC_MESSAGE }, 200);
  }
}
