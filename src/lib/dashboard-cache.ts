/**
 * Small in-process TTL cache for the admin dashboard summary.
 *
 * Why in-process and not Redis: this app runs as a single Next.js server and
 * there is no Redis dependency in package.json. The interface below is
 * deliberately Redis-shaped (get / set / invalidate by prefix) so swapping in
 * ioredis later is a drop-in change.
 *
 * Two behaviours matter here:
 *  1. A fresh hit (age < TTL) skips the database entirely.
 *  2. A *stale* entry is retained after expiry so that if the database is
 *     briefly unreachable — which we observed happening on this deployment's
 *     Atlas SRV lookups — the dashboard serves last-known numbers instead of
 *     failing.
 */

type Entry = {
  value: unknown;
  storedAt: number;
  expiresAt: number;
};

const store = new Map<string, Entry>();

/** Keep stale entries this long past expiry for the serve-stale-on-error path. */
const STALE_RETENTION_MS = 10 * 60 * 1000;

export const DASHBOARD_SUMMARY_TTL_MS = 45_000;

export const DASHBOARD_CACHE_PREFIX = "dashboard:summary:";

export function dashboardSummaryKey(adminId: string): string {
  return `${DASHBOARD_CACHE_PREFIX}${adminId}`;
}

export type CacheLookup<T> = {
  value: T;
  ageMs: number;
  fresh: boolean;
};

/**
 * Returns the entry if present, flagging whether it is still fresh. Callers
 * decide whether a stale value is acceptable.
 */
export function readCache<T>(key: string): CacheLookup<T> | null {
  const entry = store.get(key);
  if (!entry) return null;

  const now = Date.now();

  if (now - entry.storedAt > STALE_RETENTION_MS) {
    store.delete(key);
    return null;
  }

  return {
    value: entry.value as T,
    ageMs: now - entry.storedAt,
    fresh: now < entry.expiresAt,
  };
}

export function writeCache(key: string, value: unknown, ttlMs: number = DASHBOARD_SUMMARY_TTL_MS): void {
  const now = Date.now();
  store.set(key, { value, storedAt: now, expiresAt: now + ttlMs });
}

/**
 * Drop every cached dashboard summary. Called from order/customer write paths
 * so a new order shows up immediately rather than after the TTL.
 */
export function invalidateDashboardCache(): void {
  for (const key of store.keys()) {
    if (key.startsWith(DASHBOARD_CACHE_PREFIX)) {
      store.delete(key);
    }
  }
}

/** Exposed for tests / diagnostics. */
export function dashboardCacheSize(): number {
  return store.size;
}
