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
 * that, so its counters live in MongoDB, which every instance shares. The
 * in-memory limiter is still the right tool for the authenticated admin routes
 * it already guards.
 *
 * WHY MONGODB RATHER THAN REDIS
 * Shared state is the actual requirement, not Redis specifically. The Atlas
 * cluster is already a dependency of every request that reaches this endpoint,
 * so using it removes a service instead of adding one. A single
 * findOneAndUpdate with $inc is atomic, which is all the algorithm below needs.
 *
 * FAIL CLOSED
 * Every failure path refuses the lookup. A missing DATABASE_URL, an unreachable
 * cluster, a write error - all of them throw, and the route turns that into a
 * refusal. There is no path through this module that returns "allowed" because
 * something broke: running an unlimited public lookup would let anyone
 * enumerate order references.
 */

import type { Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";

const COLLECTION = "rate_limits";

/** Stops the fast guessing loop. */
const BURST = { name: "burst", windowMs: 10 * 60 * 1000, limit: 5 } as const;

/**
 * Stops the patient one, which the burst window alone would let run all day.
 */
const DAILY = { name: "daily", windowMs: 24 * 60 * 60 * 1000, limit: 40 } as const;

type WindowSpec = typeof BURST | typeof DAILY;

interface CounterDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

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
 * The TTL index that expires spent counters. Created once per process;
 * createIndex is idempotent, so a cold start on an existing collection is a
 * no-op round trip.
 *
 * A failure here is logged but not fatal: without the index old counters
 * accumulate, which is a housekeeping problem, not a correctness one. Refusing
 * every lookup over a missing TTL index would be the wrong trade.
 */
let ttlIndexReady: Promise<void> | null = null;

function ensureTtlIndex(collection: Collection<CounterDoc>): Promise<void> {
  if (!ttlIndexReady) {
    ttlIndexReady = collection
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" })
      .then(() => undefined)
      .catch((error) => {
        console.error(
          "[track-order] could not create the rate_limits TTL index; spent counters will accumulate:",
          error instanceof Error ? error.message : error
        );
      });
  }
  return ttlIndexReady;
}

/**
 * Count this request against one window and report the estimated usage.
 *
 * The counter is incremented BEFORE the decision is taken. That ordering is
 * deliberate: it makes the check atomic in a single round trip, and it means a
 * request that turns out to be over the limit still counts against the caller,
 * so hammering the endpoint cannot be used to slip through a gap between a read
 * and a write.
 *
 * Windows are counted as a sliding-window approximation - the current window's
 * count plus the portion of the previous window still inside the last
 * `windowMs`. A plain fixed window would let someone spend a full allowance on
 * each side of a boundary and get double the limit in a few seconds.
 */
async function countAgainstWindow(
  collection: Collection<CounterDoc>,
  key: string,
  spec: WindowSpec,
  now: number
): Promise<{ used: number; resetAt: number }> {
  const index = Math.floor(now / spec.windowMs);
  const windowStart = index * spec.windowMs;
  const resetAt = windowStart + spec.windowMs;

  const docId = (i: number) => `track-order:${spec.name}:${key}:${i}`;

  // Kept for two windows so the previous one is still readable.
  const expiresAt = new Date(resetAt + spec.windowMs);

  const current = await collection.findOneAndUpdate(
    { _id: docId(index) },
    { $inc: { count: 1 }, $set: { expiresAt } },
    { upsert: true, returnDocument: "after" }
  );

  const currentCount = current?.count ?? 1;

  const previous = await collection.findOne({ _id: docId(index - 1) });
  const previousCount = previous?.count ?? 0;

  // How much of the previous window is still within the trailing windowMs.
  const elapsedInWindow = now - windowStart;
  const previousWeight = (spec.windowMs - elapsedInWindow) / spec.windowMs;

  return {
    used: currentCount + previousCount * previousWeight,
    resetAt,
  };
}

/**
 * Check both windows for one IP.
 *
 * @throws RateLimiterUnavailableError when the limiter cannot run. Callers MUST
 * treat that as a refusal, never as a pass.
 */
export async function limitTrackOrderLookup(
  ip: string
): Promise<RateLimitDecision> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new RateLimiterUnavailableError("DATABASE_URL is not set");
  }

  let collection: Collection<CounterDoc>;
  try {
    const db = await getMongoDb();
    collection = db.collection<CounterDoc>(COLLECTION);
  } catch (error) {
    throw new RateLimiterUnavailableError(
      error instanceof Error ? error.message : "could not reach the database"
    );
  }

  await ensureTtlIndex(collection);

  const now = Date.now();

  // Both windows are always counted, so a caller cannot spend the daily
  // allowance without it being recorded just because the burst window blocked.
  let burst: { used: number; resetAt: number };
  let daily: { used: number; resetAt: number };
  try {
    [burst, daily] = await Promise.all([
      countAgainstWindow(collection, ip, BURST, now),
      countAgainstWindow(collection, ip, DAILY, now),
    ]);
  } catch (error) {
    // A write failure must not become a free pass.
    throw new RateLimiterUnavailableError(
      error instanceof Error ? error.message : "counter write failed"
    );
  }

  const exceeded = [
    { over: burst.used > BURST.limit, resetAt: burst.resetAt },
    { over: daily.used > DAILY.limit, resetAt: daily.resetAt },
  ].filter((entry) => entry.over);

  if (exceeded.length === 0) return { ok: true };

  const retryAfterMs = Math.max(...exceeded.map((entry) => entry.resetAt - now));

  return {
    ok: false,
    retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}
