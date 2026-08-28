/**
 * Razorpay environment validation — SERVER ONLY.
 *
 * This module reads RAZORPAY_KEY_SECRET. It must never be imported from a
 * client component, a hook used by one, or anything else that ends up in the
 * browser bundle. It previously lived on the shared razorpayDebugger, which the
 * client-side useRazorpayPayment hook imports — that put the secret's env
 * identifier into a client chunk.
 *
 * The guard below is a runtime backstop: if this ever gets pulled into a client
 * bundle again, it fails loudly at import time instead of shipping silently.
 */

import { razorpayDebugger } from "./razorpay-debug";

if (typeof window !== "undefined") {
  throw new Error(
    "razorpay-env-check is server-only and must not be imported into client code"
  );
}

export interface EnvCheckResult {
  valid: boolean;
  issues: string[];
}

/**
 * Check that the Razorpay environment variables are present and well-formed.
 *
 * Reports on shape only — presence, stray whitespace, expected prefix, plausible
 * length. No credential value, or any prefix of one, is ever logged or returned.
 */
export function validateRazorpayEnvironment(): EnvCheckResult {
  const issues: string[] = [];

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    issues.push("RAZORPAY_KEY_ID is not set");
  } else if (keyId.trim() !== keyId) {
    issues.push("RAZORPAY_KEY_ID has leading/trailing spaces");
  } else if (!keyId.startsWith("rzp_test_") && !keyId.startsWith("rzp_live_")) {
    issues.push("RAZORPAY_KEY_ID does not start with rzp_test_ or rzp_live_");
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    issues.push("RAZORPAY_KEY_SECRET is not set");
  } else if (keySecret.trim() !== keySecret) {
    issues.push("RAZORPAY_KEY_SECRET has leading/trailing spaces");
  } else if (keySecret.length < 20) {
    issues.push("RAZORPAY_KEY_SECRET looks too short");
  }

  const mode = process.env.RAZORPAY_MODE;
  if (mode && mode !== "test" && mode !== "live") {
    issues.push('RAZORPAY_MODE must be "test" or "live"');
  }

  const valid = issues.length === 0;

  // Only the issue list is logged — it names variables, never values.
  razorpayDebugger.log(
    valid ? "SUCCESS" : "WARN",
    "ENV",
    valid ? "Razorpay environment looks valid" : "Razorpay environment validation failed",
    valid ? undefined : { issues }
  );

  return { valid, issues };
}
