import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Step 6b - ADMIN_2FA_REQUIRED on the routes that check the admin inline
 * (authenticate() + role === ADMIN) instead of withAdmin().
 *
 * Real: every route handler below, authenticate(), the guard
 * (src/lib/admin-2fa-route-guard.ts) and the enforcement helpers.
 * Fake: Prisma and MongoDB (inert stores that answer every call with an empty
 * result), and the email senders, so a handler that gets past the guard runs
 * to its normal response without touching anything real.
 */

process.env.JWT_SECRET = 'test-jwt-secret-step6b';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

const ORDER_ID = '507f1f77bcf86cd799439011';
const ADMIN_ID = '507f1f77bcf86cd799439012';
const CUSTOMER_ID = '507f1f77bcf86cd799439013';
const SETUP = 'Two-factor authentication setup required';

// ---- inert fakes ---------------------------------------------------------------
/** Any model, any method -> a plausible empty result. */
function fakeModel(model: string) {
  return new Proxy({}, {
    get: (_t, method: string) => vi.fn(async () => {
      if (method === 'findMany' || method === 'groupBy') return [];
      if (method === 'count') return 0;
      if (method === 'aggregate') return { _sum: {}, _count: {}, _avg: {} };
      if (method.startsWith('find')) {
        if (model === 'order') return { id: ORDER_ID, userId: CUSTOMER_ID, status: 'PENDING', items: [] };
        if (model === 'user') return { id: ADMIN_ID, email: 'admin@tapvyo.in', role: 'ADMIN', twoFactorEnabled: false, twoFactorSecret: null };
        return null;
      }
      if (method === 'deleteMany' || method === 'updateMany') return { count: 0 };
      return { id: ORDER_ID };
    }),
  });
}
vi.mock('@/lib/prisma', () => {
  const client = new Proxy({}, {
    get: (_t, model: string) => (model === '$transaction'
      ? vi.fn(async (arg: unknown) => (Array.isArray(arg) ? Promise.all(arg) : undefined))
      : fakeModel(model)),
  });
  return { default: client, prisma: client };
});

/** A Mongo cursor / collection that chains and resolves to nothing. */
function fakeCursor(): unknown {
  return new Proxy({}, {
    get: (_t, prop: string) => {
      if (prop === 'then') return undefined;
      if (prop === 'toArray') return async () => [];
      if (prop === 'countDocuments' || prop === 'estimatedDocumentCount') return async () => 0;
      if (prop === 'findOne') return async () => null;
      if (prop === 'find' || prop === 'aggregate' || prop === 'sort' || prop === 'limit' || prop === 'skip' || prop === 'project') {
        return () => fakeCursor();
      }
      return async () => ({ acknowledged: true, matchedCount: 0, modifiedCount: 0, deletedCount: 0 });
    },
  });
}
vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => ({ collection: () => fakeCursor() })),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
  sendBulkNewsletter: vi.fn(async () => ({ sent: 0, failed: 0 })),
  isEmailConfigured: vi.fn(() => false),
}));
vi.mock('@/lib/emails/send-order-email', () => ({
  sendOrderStatusEmail: vi.fn(async () => ({ success: true })),
}));

const { generateToken } = await import('@/lib/auth');
const { mintAdminSessionToken } = await import('@/lib/admin-session-token');
const { admin2faSetupBlock } = await import('@/lib/admin-2fa-route-guard');
const { NextRequest } = await import('next/server');

type Handler = (req: InstanceType<typeof NextRequest>, ctx?: unknown) => Promise<Response>;
const load = async (path: string) => (await import(path)) as Record<string, Handler>;

const adminDashboard = await load('../app/api/admin/dashboard/route');
const adminStats = await load('../app/api/admin/stats/route');
const adminAccount = await load('../app/api/admin/account/route');
const adminOrder = await load('../app/api/admin/orders/[id]/route');
const adminNewsletters = await load('../app/api/admin/newsletters/route');
const adminNewsletter = await load('../app/api/admin/newsletters/[id]/route');
const adminNewsletterSend = await load('../app/api/admin/newsletters/[id]/send/route');
const adminSubscribers = await load('../app/api/admin/subscribers/route');
const dashboard = await load('../app/api/dashboard/route');
const orders = await load('../app/api/orders/route');
const order = await load('../app/api/orders/[id]/route');
const twoFaStatus = await load('../app/api/admin/security/2fa/status/route');
const passwordChange = await load('../app/api/admin/security/password/route');

// ---- tokens & requests ---------------------------------------------------------------
/** An admin session from before Step 6: no twoFactorEnabled claim. */
const legacyAdmin = () => generateToken({ userId: ADMIN_ID, email: 'admin@tapvyo.in', role: 'ADMIN' });
const enrolledAdmin = () => mintAdminSessionToken({ id: ADMIN_ID, email: 'admin@tapvyo.in', role: 'ADMIN', twoFactorEnabled: true });
const customer = () => generateToken({ userId: CUSTOMER_ID, email: 'c@tapvyo.in', role: 'CUSTOMER' });

let ip = 0;
function req(method: string, path: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = { 'x-forwarded-for': `192.0.2.${++ip % 250}` };
  if (token) headers.cookie = `auth-token=${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  return new NextRequest(`https://tapvyo.in${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ctx = { params: Promise.resolve({ id: ORDER_ID }) };

type Case = { name: string; handler: Handler; method: string; path: string; body?: unknown; ctx?: unknown };

/** Every handler with an inline admin check in the admin-only files. */
const ADMIN_ONLY: Case[] = [
  { name: 'GET /api/admin/dashboard', handler: adminDashboard.GET, method: 'GET', path: '/api/admin/dashboard' },
  { name: 'GET /api/admin/stats', handler: adminStats.GET, method: 'GET', path: '/api/admin/stats' },
  { name: 'GET /api/admin/account', handler: adminAccount.GET, method: 'GET', path: '/api/admin/account' },
  { name: 'PUT /api/admin/account', handler: adminAccount.PUT, method: 'PUT', path: '/api/admin/account', body: {} },
  { name: 'GET /api/admin/orders/[id]', handler: adminOrder.GET, method: 'GET', path: `/api/admin/orders/${ORDER_ID}` },
  { name: 'PATCH /api/admin/orders/[id]', handler: adminOrder.PATCH, method: 'PATCH', path: `/api/admin/orders/${ORDER_ID}`, body: { status: 'CONFIRMED' } },
  { name: 'DELETE /api/admin/orders/[id]', handler: adminOrder.DELETE, method: 'DELETE', path: `/api/admin/orders/${ORDER_ID}` },
  { name: 'GET /api/admin/newsletters', handler: adminNewsletters.GET, method: 'GET', path: '/api/admin/newsletters' },
  { name: 'POST /api/admin/newsletters', handler: adminNewsletters.POST, method: 'POST', path: '/api/admin/newsletters', body: {} },
  { name: 'GET /api/admin/newsletters/[id]', handler: adminNewsletter.GET, method: 'GET', path: `/api/admin/newsletters/${ORDER_ID}` },
  { name: 'PATCH /api/admin/newsletters/[id]', handler: adminNewsletter.PATCH, method: 'PATCH', path: `/api/admin/newsletters/${ORDER_ID}`, body: {} },
  { name: 'DELETE /api/admin/newsletters/[id]', handler: adminNewsletter.DELETE, method: 'DELETE', path: `/api/admin/newsletters/${ORDER_ID}` },
  { name: 'POST /api/admin/newsletters/[id]/send', handler: adminNewsletterSend.POST, method: 'POST', path: `/api/admin/newsletters/${ORDER_ID}/send` },
  { name: 'GET /api/admin/subscribers', handler: adminSubscribers.GET, method: 'GET', path: '/api/admin/subscribers' },
  { name: 'DELETE /api/admin/subscribers', handler: adminSubscribers.DELETE, method: 'DELETE', path: `/api/admin/subscribers?id=${ORDER_ID}` },
  { name: 'PATCH /api/admin/subscribers', handler: adminSubscribers.PATCH, method: 'PATCH', path: '/api/admin/subscribers', body: {} },
  { name: 'GET /api/dashboard', handler: dashboard.GET, method: 'GET', path: '/api/dashboard' },
];

/** Routes customers also use; only the admin branch is guarded. */
const SHARED: Case[] = [
  { name: 'GET /api/orders', handler: orders.GET, method: 'GET', path: '/api/orders' },
  { name: 'GET /api/orders/[id]', handler: order.GET, method: 'GET', path: `/api/orders/${ORDER_ID}`, ctx },
  { name: 'PUT /api/orders/[id]', handler: order.PUT, method: 'PUT', path: `/api/orders/${ORDER_ID}`, body: { status: 'PENDING' }, ctx },
  { name: 'PATCH /api/orders/[id]', handler: order.PATCH, method: 'PATCH', path: `/api/orders/${ORDER_ID}`, body: { status: 'CONFIRMED' }, ctx },
  { name: 'DELETE /api/orders/[id]', handler: order.DELETE, method: 'DELETE', path: `/api/orders/${ORDER_ID}`, ctx },
];

async function call(c: Case, token?: string) {
  const res = await c.handler(req(c.method, c.path, token, c.body), c.ctx);
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body };
}

const isSetupBlock = (r: { status: number; body: unknown }) =>
  r.status === 403 && JSON.stringify(r.body) === JSON.stringify({ success: false, message: SETUP, error: SETUP });

beforeEach(() => {
  delete process.env.ADMIN_2FA_REQUIRED;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.ADMIN_2FA_REQUIRED;
});

// ---- the guard itself -------------------------------------------------------------------
describe('admin2faSetupBlock()', () => {
  it('is null with enforcement off, whatever the token', () => {
    expect(admin2faSetupBlock(req('GET', '/api/admin/stats', legacyAdmin()))).toBeNull();
  });

  it('with enforcement on: blocks an admin without the claim, passes enrolled admins, customers and anonymous', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const blocked = admin2faSetupBlock(req('GET', '/api/admin/stats', legacyAdmin()));
    expect(blocked?.status).toBe(403);
    expect(await blocked!.json()).toEqual({ success: false, message: SETUP, error: SETUP });
    expect(admin2faSetupBlock(req('GET', '/api/admin/stats', enrolledAdmin()))).toBeNull();
    expect(admin2faSetupBlock(req('GET', '/api/orders', customer()))).toBeNull();
    expect(admin2faSetupBlock(req('GET', '/api/orders'))).toBeNull();
  });

  it('never blocks the exempt security paths', () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    for (const path of ['/api/admin/security/2fa/status', '/api/admin/security/password']) {
      expect(admin2faSetupBlock(req('GET', path, legacyAdmin())), path).toBeNull();
    }
  });
});

// ---- admin-only routes ---------------------------------------------------------------------
describe.each(ADMIN_ONLY)('$name', (c) => {
  it('enforcement on + admin token without the claim -> 403 setup required', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(isSetupBlock(await call(c, legacyAdmin()))).toBe(true);
  });

  it('enforcement on + enrolled admin -> reaches the handler', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(isSetupBlock(await call(c, enrolledAdmin()))).toBe(false);
  });

  it('enforcement off + admin token without the claim -> same response as an enrolled admin with enforcement on', async () => {
    const off = await call(c, legacyAdmin());
    expect(isSetupBlock(off)).toBe(false);
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const enrolled = await call(c, enrolledAdmin());
    expect(off.status).toBe(enrolled.status);
  });

  it('customer and anonymous responses are identical with enforcement on and off', async () => {
    const before = [await call(c, customer()), await call(c)];
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const after = [await call(c, customer()), await call(c)];
    expect(after).toEqual(before);
    for (const r of after) expect(isSetupBlock(r)).toBe(false);
  });
});

// ---- shared routes ------------------------------------------------------------------------------
describe.each(SHARED)('$name (shared)', (c) => {
  it('enforcement on + admin token without the claim -> 403 setup required', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(isSetupBlock(await call(c, legacyAdmin()))).toBe(true);
  });

  it('enforcement on + enrolled admin -> reaches the handler', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(isSetupBlock(await call(c, enrolledAdmin()))).toBe(false);
  });

  it('enforcement off + admin token without the claim -> guard is a no-op', async () => {
    const off = await call(c, legacyAdmin());
    expect(isSetupBlock(off)).toBe(false);
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect((await call(c, enrolledAdmin())).status).toBe(off.status);
  });

  it('customer (no claim) -> identical response whatever the flag', async () => {
    const before = await call(c, customer());
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const after = await call(c, customer());
    expect(after).toEqual(before);
    expect(isSetupBlock(after)).toBe(false);
  });

  it('unauthenticated -> identical response whatever the flag', async () => {
    const before = await call(c);
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(await call(c)).toEqual(before);
  });
});

// ---- exempt routes stay reachable ------------------------------------------------------------------
describe('exempt security routes under enforcement', () => {
  it('GET /api/admin/security/2fa/status is not blocked for an admin without the claim', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const r = await call({ name: 'status', handler: twoFaStatus.GET, method: 'GET', path: '/api/admin/security/2fa/status' }, legacyAdmin());
    expect(isSetupBlock(r)).toBe(false);
    expect(r.status).toBe(200);
  });

  it('POST /api/admin/security/password is not blocked for an admin without the claim', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const r = await call({ name: 'password', handler: passwordChange.POST, method: 'POST', path: '/api/admin/security/password', body: {} }, legacyAdmin());
    expect(isSetupBlock(r)).toBe(false);
  });
});
