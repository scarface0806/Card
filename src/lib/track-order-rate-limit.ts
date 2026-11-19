/**
 * Rate limiting for the public order-tracking lookup.
 *
 * SERVER-ONLY.
 *
 * The counting itself lives in src/lib/mongo-rate-limit.ts (shared with the
 * customer artwork upload) - see that file for why it is MongoDB-backed rather
 * than the in-memory src/lib/rate-limit.ts. This module only fixes the windows
 * for /track-order and keeps the error type its route already handles.
 *
 * FAIL CLOSED
 * Every failure path refuses the lookup. A missing DATABASE_URL, an unreachable
 * cluster, a write error - all of them throw, and the route turns that into a
 * refusal. There is no path through this module that returns "allowed" because
 * something broke: running an unlimited public lookup would let anyone
 * enumerate order references.
 */

import {
  consumeRateLimit,
  MongoRateLimitUnavailableError,
  type RateLimitDecision,
} from "@/lib/mongo-rate-limit";

export type { RateLimitDecision } from "@/lib/mongo-rate-limit";

/** Stops the fast guessing loop. */
const BURST = { name: "burst", windowMs: 10 * 60 * 1000, limit: 5 } as const;

/**
 * Stops the patient one, which the burst window alone would let run all day.
 */
const DAILY = { name: "daily", windowMs: 24 * 60 * 60 * 1000, limit: 40 } as const;

export class RateLimiterUnavailableError extends Error {
  constructor(reason: string) {
    super(
      `[track-order] refusing lookup: rate limiter unavailable (${reason}). ` +
        "Order tracking stays disabled rather than running without a shared " +
        "rate limit, because an unlimited public lookup lets anyone enumerate " +
        "order references."
    );
    this.name = "RateLimiterUnavailableError";
  }
}

/**
 * The client IP, taken from the headers Vercel sets on the incoming request.
 * `x-forwarded-for` is a comma-separated chain; Vercel appends the real client
 * IP as the FIRST entry, and the platform overwrites any value a client tries
 * to inject, so the first entry is the one to key on.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Check both windows for one IP.
 *
 * @throws RateLimiterUnavailableError when the limiter cannot run. Callers MUST
 * treat that as a refusal, never as a pass.
 */
export async function limitTrackOrderLookup(ip: string): Promise<RateLimitDecision> {
  try {
    return await consumeRateLimit("track-order", ip, [BURST, DAILY]);
  } catch (error) {
    if (error instanceof MongoRateLimitUnavailableError) {
      throw new RateLimiterUnavailableError(error.message);
    }
    throw error;
  }
}
