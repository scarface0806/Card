import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/login - shared (MongoDB) rate limits and lockout.
 *
 * The `rate_limits` collection is replaced by an in-memory fake that behaves
 * like the real one for the operations the limiter uses. Two "instances" of
 * the route are separate module copies (vi.resetModules), sharing NOTHING but
 * that fake database - which is exactly the property the old per-process Map
 * lacked.
 *
 * Time is driven by a mocked Date.now so the per-minute limits can be kept
 * out of the way while lockout is exercised.
 */

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

const PASSWORD = 'Admin-pass-123';
const HASH = bcrypt.hashSync(PASSWORD, 4);
const ADMIN = {
  id: 'admin1',
  email: 'admin@tapvyo.in',
  password: HASH,
  name: 'Admin',
  role: 'ADMIN',
  isActive: true,
  phone: null,
  avatar: null,
};

// ---- fake rate_limits collection --------------------------------------------
const store = new Map<string, { _id: string; count: number; expiresAt: Date }>();
let dbMode: 'ok' | 'down' = 'ok';

const collection = {
  createIndex: vi.fn(async () => 'expiresAt_ttl'),
  findOneAndUpdate: vi.fn(async (filter: { _id: string }, update: { $set: { expiresAt: Date } }) => {
    const doc = store.get(filter._id) ?? { _id: filter._id, count: 0, expiresAt: update.$set.expiresAt };
    const next = { ...doc, count: doc.count + 1, expiresAt: update.$set.expiresAt };
    store.set(filter._id, next);
    return next;
  }),
  findOne: vi.fn(async (filter: { _id: string }) => store.get(filter._id) ?? null),
  deleteMany: vi.fn(async (filter: { _id: { $in: string[] } }) => {
    for (const id of filter._id.$in) store.delete(id);
    return { deletedCount: 0 };
  }),
};

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => {
    if (dbMode === 'down') throw new Error('ECONNREFUSED');
    return { collection: () => collection };
  }),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        where.email === ADMIN.email ? ADMIN : null
      ),
    },
  },
}));

// ---- clock -------------------------------------------------------------------
const FIFTEEN_MIN = 15 * 60 * 1000;
// Aligned to the start of a 15-minute (and therefore 1-minute) window.
const BASE = Math.ceil(Date.UTC(2026, 10, 20) / FIFTEEN_MIN) * FIFTEEN_MIN;
let now = BASE;
const tick = (ms: number) => {
  now += ms;
};

type Route = typeof import('../app/api/admin/login/route');
async function freshInstance(): Promise<Route> {
  vi.resetModules();
  return import('../app/api/admin/login/route');
}

const { NextRequest } = await import('next/server');

function attempt(route: Route, email: string, password: string, ip: string) {
  return route.POST(
    new NextRequest('https://tapvyo.in/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ email, password }),
    })
  );
}

let route: Route;

beforeEach(async () => {
  store.clear();
  dbMode = 'ok';
  now = BASE;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  route = await freshInstance();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('admin login rate limits (shared across instances)', () => {
  it('counts attempts from two separate instances together: the 6th in a minute is refused', async () => {
    const a = route;
    const b = await freshInstance();
    expect(a).not.toBe(b);

    // Different unknown emails each time, so only the per-IP limit is in play.
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const instance = i % 2 === 0 ? a : b;
      const res = await attempt(instance, `nobody${i}@example.com`, 'x', '203.0.113.10');
      statuses.push(res.status);
    }

    // With the old per-process Map each instance would have allowed 5 (10 total).
    expect(statuses).toEqual([404, 404, 404, 404, 404, 429]);
  });

  it('applies the per-email limit across IPs: the 6th attempt on one email in a minute is refused', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await attempt(route, ADMIN.email, 'wrong', `198.51.100.${i + 1}`);
      statuses.push(res.status);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });

  it('locks an email + IP pair after 10 failures - even the correct password is then refused', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await attempt(route, ADMIN.email, 'wrong', '203.0.113.20');
      expect(res.status).toBe(401);
      tick(61 * 1000); // keep the per-minute limits out of the way
    }

    const locked = await attempt(route, ADMIN.email, PASSWORD, '203.0.113.20');
    expect(locked.status).toBe(429);
    expect(locked.headers.get('Retry-After')).toBeTruthy();
    expect(locked.cookies.get('auth-token')).toBeUndefined();

    // A different IP is a different pair, and the email-wide cap (30) is not reached.
    const elsewhere = await attempt(route, ADMIN.email, PASSWORD, '203.0.113.21');
    expect(elsewhere.status).toBe(200);
  });

  it('locks an email after 30 failures spread across many IPs', async () => {
    const ips = ['192.0.2.1', '192.0.2.2', '192.0.2.3', '192.0.2.4'];
    for (let i = 0; i < 30; i++) {
      const res = await attempt(route, ADMIN.email, 'wrong', ips[i % ips.length]);
      expect(res.status).toBe(401);
      tick(20 * 1000); // ~3 a minute on the email: under its per-minute limit
    }

    // No single pair reached 10 (30 / 4 IPs), so this is the email-wide cap.
    const res = await attempt(route, ADMIN.email, PASSWORD, '192.0.2.99');
    expect(res.status).toBe(429);
  });

  it('gives an identical 429 for an existing and a non-existent email', async () => {
    async function lockOut(email: string) {
      store.clear();
      now = BASE;
      for (let i = 0; i < 10; i++) {
        await attempt(route, email, 'wrong', '203.0.113.30');
        tick(61 * 1000);
      }
      return attempt(route, email, 'wrong', '203.0.113.30');
    }

    const real = await lockOut(ADMIN.email);
    const fake = await lockOut('ghost@example.com');

    expect(real.status).toBe(429);
    expect(fake.status).toBe(429);
    expect(await real.json()).toEqual(await fake.json());
    expect(real.headers.get('Retry-After')).toBe(fake.headers.get('Retry-After'));
  });

  it("clears the pair's failures on a successful login", async () => {
    for (let i = 0; i < 9; i++) {
      await attempt(route, ADMIN.email, 'wrong', '203.0.113.40');
      tick(61 * 1000);
    }
    const ok = await attempt(route, ADMIN.email, PASSWORD, '203.0.113.40');
    expect(ok.status).toBe(200);
    tick(61 * 1000);

    // Without the reset this would be failure #10 and the next attempt locked.
    for (let i = 0; i < 2; i++) {
      const res = await attempt(route, ADMIN.email, 'wrong', '203.0.113.40');
      expect(res.status).toBe(401);
      tick(61 * 1000);
    }
  });

  it('keeps the success response and cookies unchanged', async () => {
    const res = await attempt(route, ADMIN.email, PASSWORD, '203.0.113.50');
    expect(res.status).toBe(200);
    for (const name of ['auth-token', 'admin-token', 'token']) {
      expect(res.cookies.get(name)?.value).toBeTruthy();
    }
    const body = await res.json();
    expect(body).toMatchObject({ success: true, message: 'Login successful', user: { email: ADMIN.email, role: 'ADMIN' } });
  });

  it('fails closed with 503 when the shared limiter cannot reach the database', async () => {
    dbMode = 'down';
    const res = await attempt(route, ADMIN.email, PASSWORD, '203.0.113.60');
    expect(res.status).toBe(503);
    expect(res.cookies.get('auth-token')).toBeUndefined();
  });
});
