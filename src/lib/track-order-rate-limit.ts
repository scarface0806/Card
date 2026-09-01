/**
 * Rate limiting for the public order-tracking lookup.
 *
 * SERVER-ONLY.
 *
 * WHY THIS DOES NOT USE src/lib/rate-limit.ts
 * That limiter keeps its counters in a per-process Map. On Vercel every
 * serverless instance gets its own Map, so an attacker enumerating order
 * references simply spreads requests across instances and gets an effectively
 * unlimited budget. /track-order is exactly the endpoint that cannot afford
 * that, so it uses shared state in Upstash Redis instead. The in-memory
 * limiter is still the right tool for the authenticated admin routes it
 * already guards.
 *
 * FAIL CLOSED
 * With the Upstash environment variables missing, this module refuses to hand
 * out a limiter, and the route turns that into a rejection. It never silently
 * degrades to unlimited lookups. A missing configuration is logged loudly at
 * module load; the throw itself is deferred to first use so that `next build`
 * (which imports route modules) reports a build failure only for genuine code
 * problems, not for a variable that is set in the deployment environment.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getRequiredEnv } from "@/lib/env";

const REDIS_URL_VAR = "UPSTASH_REDIS_REST_URL";
const REDIS_TOKEN_VAR = "UPSTASH_REDIS_REST_TOKEN";

const MISCONFIGURED_MESSAGE =
  `[track-order] ${REDIS_URL_VAR} and ${REDIS_TOKEN_VAR} are not set. ` +
  "Order tracking is DISABLED until they are, because running the lookup " +
  "without a shared rate limit would let anyone enumerate order references.";

if (!process.env[REDIS_URL_VAR] || !process.env[REDIS_TOKEN_VAR]) {
  console.error(MISCONFIGURED_MESSAGE);
}

export class RateLimiterUnavailableError extends Error {
  constructor() {
    super(MISCONFIGURED_MESSAGE);
    this.name = "RateLimiterUnavailableError";
  }
}

interface Limiters {
  burst: Ratelimit;
  daily: Ratelimit;
}

let limiters: Limiters | null = null;

function getLimiters(): Limiters {
  if (limiters) return limiters;

  if (!process.env[REDIS_URL_VAR] || !process.env[REDIS_TOKEN_VAR]) {
    throw new RateLimiterUnavailableError();
  }

  const redis = new Redis({
    url: getRequiredEnv(REDIS_URL_VAR),
    token: getRequiredEnv(REDIS_TOKEN_VAR),
  });

  limiters = {
    // Stops the fast guessing loop.
    burst: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "tapvyo:track-order:burst",
      analytics: false,
    }),
    // Stops the patient one, which the burst window alone would allow to run
    // for as long as it likes.
    daily: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "1 d"),
      prefix: "tapvyo:track-order:daily",
      analytics: false,
    }),
  };

  return limiters;
}

export interface RateLimitDecision {
  ok: boolean;
  /** Seconds until the caller may try again. Undefined when allowed. */
  retryAfter?: number;
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
 * Check both windows for one IP. Throws RateLimiterUnavailableError when
 * Upstash is not configured - callers must treat that as a refusal, never as a
 * pass.
 */
export async function limitTrackOrderLookup(
  ip: string
): Promise<RateLimitDecision> {
  const { burst, daily } = getLimiters();

  const [burstResult, dailyResult] = await Promise.all([
    burst.limit(ip),
    daily.limit(ip),
  ]);

  const blocked = [burstResult, dailyResult].filter((result) => !result.success);

  if (blocked.length === 0) return { ok: true };

  const retryAfterMs = Math.max(...blocked.map((result) => result.reset - Date.now()));

  return {
    ok: false,
    retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}
