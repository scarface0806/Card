/**
 * Shared, MongoDB-backed rate limiting. SERVER-ONLY.
 *
 * Extracted from track-order-rate-limit.ts so a second caller (the customer
 * artwork upload) could reuse it without copying the algorithm. The logic is
 * unchanged; the reasoning lives here now:
 *
 * WHY NOT src/lib/rate-limit.ts
 * That limiter keeps its counters in a per-process Map. On Vercel every
 * serverless instance gets its own Map, so a caller who spreads requests across
 * instances gets an effectively unlimited budget. These counters live in the
 * `rate_limits` collection, which every instance shares.
 *
 * WHY MONGODB RATHER THAN REDIS
 * Shared state is the actual requirement, not Redis specifically. The Atlas
 * cluster is already a dependency of every request that reaches these routes,
 * so using it removes a service instead of adding one. A single
 * findOneAndUpdate with $inc is atomic, which is all the algorithm needs.
 *
 * FAIL CLOSED
 * Every failure path throws MongoRateLimitUnavailableError, and callers must
 * treat that as a refusal. There is no path that returns "allowed" because
 * something broke.
 */

import type { Collection } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";

const COLLECTION = "rate_limits";

export interface RateWindow {
  /** Part of the counter key, e.g. "burst" or "daily". */
  name: string;
  windowMs: number;
  limit: number;
}

export interface RateLimitDecision {
  ok: boolean;
  /** Seconds until the caller may try again. Undefined when allowed. */
  retryAfter?: number;
}

export class MongoRateLimitUnavailableError extends Error {
  constructor(reason: string) {
    super(`rate limiter unavailable (${reason})`);
    this.name = "MongoRateLimitUnavailableError";
  }
}

interface CounterDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

/**
 * The TTL index that expires spent counters. Created once per process;
 * createIndex is idempotent, so a cold start on an existing collection is a
 * no-op round trip.
 *
 * A failure here is logged but not fatal: without the index old counters
 * accumulate, which is a housekeeping problem, not a correctness one. Refusing
 * every request over a missing TTL index would be the wrong trade.
 */
let ttlIndexReady: Promise<void> | null = null;

function ensureTtlIndex(collection: Collection<CounterDoc>): Promise<void> {
  if (!ttlIndexReady) {
    ttlIndexReady = collection
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" })
      .then(() => undefined)
      .catch((error) => {
        console.error(
          "[rate-limit] could not create the rate_limits TTL index; spent counters will accumulate:",
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
  scope: string,
  key: string,
  spec: RateWindow,
  now: number
): Promise<{ used: number; resetAt: number }> {
  const index = Math.floor(now / spec.windowMs);
  const windowStart = index * spec.windowMs;
  const resetAt = windowStart + spec.windowMs;

  // Same key shape the track-order limiter always used, so its existing
  // counters carry over unchanged.
  const docId = (i: number) => `${scope}:${spec.name}:${key}:${i}`;

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
 * Count one request for `key` against every window in `windows`.
 *
 * @param scope   Namespaces the counters, e.g. "track-order" or "custom-card-upload".
 * @param key     Who is being limited: an IP, a user id.
 * @throws MongoRateLimitUnavailableError when the limiter cannot run. Callers
 * MUST treat that as a refusal, never as a pass.
 */
export async function consumeRateLimit(
  scope: string,
  key: string,
  windows: readonly RateWindow[]
): Promise<RateLimitDecision> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new MongoRateLimitUnavailableError("DATABASE_URL is not set");
  }

  let collection: Collection<CounterDoc>;
  try {
    const db = await getMongoDb();
    collection = db.collection<CounterDoc>(COLLECTION);
  } catch (error) {
    throw new MongoRateLimitUnavailableError(
      error instanceof Error ? error.message : "could not reach the database"
    );
  }

  await ensureTtlIndex(collection);

  const now = Date.now();

  // Every window is always counted, so a caller cannot spend a longer window's
  // allowance without it being recorded just because a shorter one blocked.
  let results: { used: number; resetAt: number }[];
  try {
    results = await Promise.all(
      windows.map((spec) => countAgainstWindow(collection, scope, key, spec, now))
    );
  } catch (error) {
    // A write failure must not become a free pass.
    throw new MongoRateLimitUnavailableError(
      error instanceof Error ? error.message : "counter write failed"
    );
  }

  const exceeded = results.filter((result, i) => result.used > windows[i].limit);

  if (exceeded.length === 0) return { ok: true };

  const retryAfterMs = Math.max(...exceeded.map((entry) => entry.resetAt - now));

  return {
    ok: false,
    retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}

/* ---------------------------------------------------------------------------
   LOCKOUT SUPPORT - peekRateLimit / resetRateLimit

   consumeRateLimit counts EVERY call. A lockout needs a second kind of
   counter that only FAILURES increment, and that is CHECKED (without being
   incremented) before the expensive or sensitive work runs:

     1. peekRateLimit(failScope, key, windows)    - locked out? refuse first.
     2. ...do the work (e.g. check the password)...
     3. on failure: consumeRateLimit(failScope, key, windows)
     4. on success: resetRateLimit(failScope, key, windows)   (optional)

   Both use the same documents, key shape and sliding-window estimate as
   consumeRateLimit, and both fail closed the same way.
   --------------------------------------------------------------------------- */

/** Connect for the lockout helpers. Mirrors consumeRateLimit's fail-closed checks. */
async function openCounters(): Promise<Collection<CounterDoc>> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new MongoRateLimitUnavailableError("DATABASE_URL is not set");
  }
  try {
    const db = await getMongoDb();
    const collection = db.collection<CounterDoc>(COLLECTION);
    await ensureTtlIndex(collection);
    return collection;
  } catch (error) {
    throw new MongoRateLimitUnavailableError(
      error instanceof Error ? error.message : "could not reach the database"
    );
  }
}

/**
 * Would ONE more counted event exceed any window? Reads only - nothing is
 * incremented. "Blocked" means used + 1 > limit, i.e. the same point at which
 * consumeRateLimit would refuse the next call, so with limit 10 the 11th
 * attempt is refused after 10 recorded failures.
 *
 * @throws MongoRateLimitUnavailableError when the limiter cannot run.
 */
export async function peekRateLimit(
  scope: string,
  key: string,
  windows: readonly RateWindow[]
): Promise<RateLimitDecision> {
  const collection = await openCounters();
  const now = Date.now();

  let results: { used: number; resetAt: number }[];
  try {
    results = await Promise.all(
      windows.map(async (spec) => {
        const index = Math.floor(now / spec.windowMs);
        const windowStart = index * spec.windowMs;
        const docId = (i: number) => `${scope}:${spec.name}:${key}:${i}`;

        const [current, previous] = await Promise.all([
          collection.findOne({ _id: docId(index) }),
          collection.findOne({ _id: docId(index - 1) }),
        ]);

        const previousWeight = (spec.windowMs - (now - windowStart)) / spec.windowMs;
        return {
          used: (current?.count ?? 0) + (previous?.count ?? 0) * previousWeight,
          resetAt: windowStart + spec.windowMs,
        };
      })
    );
  } catch (error) {
    throw new MongoRateLimitUnavailableError(
      error instanceof Error ? error.message : "counter read failed"
    );
  }

  const exceeded = results.filter((result, i) => result.used + 1 > windows[i].limit);
  if (exceeded.length === 0) return { ok: true };

  const retryAfterMs = Math.max(...exceeded.map((entry) => entry.resetAt - now));
  return { ok: false, retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
}

/**
 * Clear `key`'s counters (current and previous window) for every window, e.g.
 * a user's failed-login count after a successful login.
 *
 * @throws MongoRateLimitUnavailableError when the limiter cannot run.
 */
export async function resetRateLimit(
  scope: string,
  key: string,
  windows: readonly RateWindow[]
): Promise<void> {
  const collection = await openCounters();
  const now = Date.now();

  const ids = windows.flatMap((spec) => {
    const index = Math.floor(now / spec.windowMs);
    return [index, index - 1].map((i) => `${scope}:${spec.name}:${key}:${i}`);
  });

  try {
    await collection.deleteMany({ _id: { $in: ids } });
  } catch (error) {
    throw new MongoRateLimitUnavailableError(
      error instanceof Error ? error.message : "counter reset failed"
    );
  }
}
