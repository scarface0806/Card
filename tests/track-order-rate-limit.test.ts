import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The MongoDB-backed rate limiter for /track-order.
 *
 * The two properties that matter:
 *   1. It actually blocks - 5 lookups per 10 minutes per IP, plus a daily cap,
 *      counted in shared storage rather than per-process memory.
 *   2. It fails CLOSED. Every database problem must throw, because returning
 *      "allowed" on an error would leave the endpoint open to enumeration.
 */

process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

/** Minimal stand-in for the one collection the limiter uses. */
const store = new Map<string, { _id: string; count: number; expiresAt: Date }>();
let mode: 'ok' | 'connect-fails' | 'write-fails' = 'ok';
let createdIndexes: unknown[] = [];

const collection = {
  createIndex: vi.fn(async (keys: unknown, opts: unknown) => {
    createdIndexes.push({ keys, opts });
    return 'expiresAt_ttl';
  }),
  findOneAndUpdate: vi.fn(
    async (
      filter: { _id: string },
      update: { $inc: { count: number }; $set: { expiresAt: Date } },
      _opts: unknown
    ) => {
      if (mode === 'write-fails') throw new Error('not primary');
      const existing = store.get(filter._id);
      const next = {
        _id: filter._id,
        count: (existing?.count ?? 0) + update.$inc.count,
        expiresAt: update.$set.expiresAt,
      };
      store.set(filter._id, next);
      return next;
    }
  ),
  findOne: vi.fn(async (filter: { _id: string }) => store.get(filter._id) ?? null),
};

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => {
    if (mode === 'connect-fails') throw new Error('ECONNREFUSED');
    return { collection: () => collection };
  }),
}));

const { RateLimiterUnavailableError, getClientIp, limitTrackOrderLookup } =
  await import('@/lib/track-order-rate-limit');

/**
 * A fresh copy of the module, for the tests that care about state cached at
 * module scope (the TTL-index promise).
 */
async function freshLimiter() {
  vi.resetModules();
  return import('@/lib/track-order-rate-limit');
}

beforeEach(() => {
  store.clear();
  createdIndexes = [];
  mode = 'ok';
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
});

describe('getClientIp', () => {
  it('takes the first entry of x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' });
    expect(getClientIp(headers)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then to a constant', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});

describe('limitTrackOrderLookup', () => {
  it('allows the first five lookups and blocks the sixth', async () => {
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(await limitTrackOrderLookup('203.0.113.7'));
    }

    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5].ok).toBe(false);
    expect(results[5].retryAfter).toBeGreaterThan(0);
  });

  it('counts each IP separately', async () => {
    for (let i = 0; i < 6; i++) await limitTrackOrderLookup('203.0.113.7');

    // A different visitor is unaffected by the blocked one.
    expect((await limitTrackOrderLookup('198.51.100.9')).ok).toBe(true);
  });

  it('counts a blocked attempt against the caller too', async () => {
    for (let i = 0; i < 8; i++) await limitTrackOrderLookup('203.0.113.7');

    // 8 requests recorded, not 5 - hammering cannot reset the budget.
    const burstDoc = [...store.values()].find((d) => d._id.includes(':burst:'));
    expect(burstDoc?.count).toBe(8);
  });

  it('applies the daily cap even when burst windows keep resetting', async () => {
    // Fresh burst window every call, so only the daily counter accumulates.
    let now = Date.UTC(2026, 8, 1, 0, 0, 0);
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    try {
      let blockedAt = -1;
      for (let i = 0; i < 60; i++) {
        const result = await limitTrackOrderLookup('203.0.113.7');
        if (!result.ok && blockedAt === -1) blockedAt = i;
        now += 11 * 60 * 1000; // jump past the 10 minute burst window
      }

      // 40 daily allowance, so the 41st request (index 40) is the first block.
      expect(blockedAt).toBe(40);
    } finally {
      spy.mockRestore();
    }
  });

  it('creates the TTL index once per process, not once per request', async () => {
    // Fresh module so the cached index promise starts empty.
    const limiter = await freshLimiter();

    for (let i = 0; i < 4; i++) await limiter.limitTrackOrderLookup('203.0.113.7');

    // One createIndex for four lookups - the promise is cached deliberately.
    expect(createdIndexes).toHaveLength(1);
    expect(createdIndexes[0]).toMatchObject({
      keys: { expiresAt: 1 },
      opts: { expireAfterSeconds: 0 },
    });
  });

  it('still limits when the TTL index cannot be created', async () => {
    collection.createIndex.mockRejectedValue(new Error('not authorized'));
    const limiter = await freshLimiter();

    // Housekeeping failure, not a correctness failure - it must not refuse.
    for (let i = 0; i < 5; i++) {
      expect((await limiter.limitTrackOrderLookup('203.0.113.7')).ok).toBe(true);
    }
    expect((await limiter.limitTrackOrderLookup('203.0.113.7')).ok).toBe(false);
  });
});

describe('fail closed', () => {
  it('throws when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;

    await expect(limitTrackOrderLookup('203.0.113.7')).rejects.toThrow(
      RateLimiterUnavailableError
    );
  });

  it('throws when the database is unreachable', async () => {
    mode = 'connect-fails';

    await expect(limitTrackOrderLookup('203.0.113.7')).rejects.toThrow(
      RateLimiterUnavailableError
    );
  });

  it('throws when the counter write fails', async () => {
    mode = 'write-fails';

    await expect(limitTrackOrderLookup('203.0.113.7')).rejects.toThrow(
      RateLimiterUnavailableError
    );
  });

  it('never returns ok on any failure path', async () => {
    for (const failure of ['connect-fails', 'write-fails'] as const) {
      mode = failure;
      const result = await limitTrackOrderLookup('203.0.113.7').catch(() => 'threw');
      expect(result).toBe('threw');
    }
  });
});
