import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

/**
 * Step 6 - ADMIN_2FA_REQUIRED enforcement.
 *
 * Real: the enforcement helpers, proxy(), withAdmin()/authenticate(),
 * mintAdminSessionToken, the password-login / confirm / disable routes, the
 * shared limiter (over an in-memory rate_limits fake), AES-GCM, otplib, bcrypt.
 * Fake: Prisma (an in-memory user store).
 */

process.env.JWT_SECRET = 'test-jwt-secret-step6';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');

const PASSWORD = 'Admin-pass-123';
const STEP_MS = 30_000;
const WEEK = 60 * 60 * 24 * 7;

type User = {
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  phone: string | null;
  avatar: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorBackupCodes: string[];
  twoFactorLastUsedStep: number | null;
};

let admin: User;

// ---- fake rate_limits (real limiter logic) ---------------------------------
const store = new Map<string, { _id: string; count: number; expiresAt: Date }>();
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
  getMongoDb: vi.fn(async () => ({ collection: () => collection })),
}));

// ---- fake Prisma -------------------------------------------------------------
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) =>
        (where.id ? where.id === admin.id : where.email === admin.email) ? structuredClone(admin) : null
      ),
      update: vi.fn(async ({ data }: { data: Partial<User> }) => {
        admin = { ...admin, ...data };
        return structuredClone(admin);
      }),
      updateMany: vi.fn(async ({ where, data }: {
        where: { id: string; twoFactorEnabled?: boolean; password?: string };
        data: Partial<Omit<User, 'twoFactorBackupCodes'>> & { twoFactorBackupCodes?: { set: string[] } };
      }) => {
        if (where.id !== admin.id) return { count: 0 };
        if (where.twoFactorEnabled !== undefined && admin.twoFactorEnabled !== where.twoFactorEnabled) return { count: 0 };
        if (where.password !== undefined && admin.password !== where.password) return { count: 0 };
        const { twoFactorBackupCodes, ...rest } = data;
        admin = { ...admin, ...rest, ...(twoFactorBackupCodes ? { twoFactorBackupCodes: [...twoFactorBackupCodes.set] } : {}) };
        return { count: 1 };
      }),
    },
  },
}));

const { isEnforcementOn, is2faExemptPath, adminNeeds2faSetup } = await import('@/lib/admin-2fa-enforcement');
const { mintAdminSessionToken } = await import('@/lib/admin-session-token');
const { verifyToken, generateToken } = await import('@/lib/auth');
const { withAdmin } = await import('@/lib/auth-middleware');
const { encryptSecret } = await import('@/lib/two-factor-crypto');
const { proxy } = await import('../proxy');
const { POST: passwordLogin } = await import('../app/api/admin/login/route');
const { POST: confirm } = await import('../app/api/admin/security/2fa/confirm/route');
const { POST: disable } = await import('../app/api/admin/security/2fa/disable/route');
const { NextRequest, NextResponse } = await import('next/server');
const { jwtVerify } = await import('jose');

// ---- helpers -----------------------------------------------------------------
const SECRET = authenticator.generateSecret(20);

function makeAdmin(overrides: Partial<User> = {}): User {
  return {
    id: 'admin6',
    email: 'admin6@tapvyo.in',
    password: bcrypt.hashSync(PASSWORD, 4),
    name: 'Admin Six',
    role: 'ADMIN',
    isActive: true,
    phone: null,
    avatar: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: [],
    twoFactorLastUsedStep: null,
    ...overrides,
  };
}

/** Admin token in the pre-Step-6 shape: no twoFactorEnabled claim at all. */
const legacyAdminToken = () => generateToken({ userId: 'admin6', email: 'admin6@tapvyo.in', role: 'ADMIN' });
const customerToken = () => generateToken({ userId: 'cust1', email: 'c@tapvyo.in', role: 'CUSTOMER' });
const enrolledToken = () => mintAdminSessionToken({ id: 'admin6', email: 'admin6@tapvyo.in', role: 'ADMIN', twoFactorEnabled: true });

function pageReq(path: string, token?: string) {
  return new NextRequest(`https://tapvyo.in${path}`, {
    headers: token ? { cookie: `auth-token=${token}` } : {},
  });
}

function apiReq(path: string, token: string, body?: unknown) {
  return new NextRequest(`https://tapvyo.in${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { cookie: `auth-token=${token}`, 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 250)}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const passesProxy = (res: Response) => res.headers.get('x-middleware-next') === '1';

const guarded = withAdmin(async () => NextResponse.json({ reached: true }));

/** Set-Cookie headers as { name -> { value, attrs } } with attribute names lower-cased. */
function cookiesOf(res: Response) {
  const out: Record<string, { value: string; attrs: Record<string, string | true> }> = {};
  for (const line of res.headers.getSetCookie()) {
    const [pair, ...rest] = line.split(';').map((s) => s.trim());
    const eq = pair.indexOf('=');
    const attrs: Record<string, string | true> = {};
    for (const a of rest) {
      const i = a.indexOf('=');
      if (i < 0) attrs[a.toLowerCase()] = true;
      else attrs[a.slice(0, i).toLowerCase()] = a.slice(i + 1).toLowerCase();
    }
    out[pair.slice(0, eq)] = { value: pair.slice(eq + 1), attrs };
  }
  return out;
}

function expectSessionCookies(res: Response) {
  const cookies = cookiesOf(res);
  const tokens = ['auth-token', 'admin-token', 'token'].map((name) => {
    const c = cookies[name];
    expect(c, name).toBeDefined();
    expect(c.attrs.httponly).toBe(true);
    expect(c.attrs.samesite).toBe('lax');
    expect(c.attrs['max-age']).toBe(String(WEEK));
    expect(c.attrs.path).toBe('/');
    return c.value;
  });
  expect(new Set(tokens).size).toBe(1);
  return tokens[0];
}

beforeEach(() => {
  delete process.env.ADMIN_2FA_REQUIRED;
  delete process.env.JWT_EXPIRES_IN;
  store.clear();
  admin = makeAdmin();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.ADMIN_2FA_REQUIRED;
});

// ---- helpers ---------------------------------------------------------------------
describe('isEnforcementOn', () => {
  it('is true only for the exact string "true"', () => {
    expect(isEnforcementOn()).toBe(false);
    for (const v of ['TRUE', 'True', '1', 'yes', '', ' true']) {
      process.env.ADMIN_2FA_REQUIRED = v;
      expect(isEnforcementOn(), v).toBe(false);
    }
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(isEnforcementOn()).toBe(true);
  });
});

describe('is2faExemptPath', () => {
  it.each([
    '/admin/security',
    '/admin/security/foo',
    '/api/admin/security/2fa/start',
    '/api/admin/security/2fa/status',
    '/api/admin/security/password',
    '/api/auth/logout',
    '/api/admin/login',
    '/api/admin/login/2fa',
    '/_next/static/x.js',
    '/static/a.css',
    '/favicon.ico',
    '/logo.png',
    '/fonts/a.woff2',
  ])('exempt: %s', (path) => expect(is2faExemptPath(path)).toBe(true));

  it.each([
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/securityx',
    '/api/admin/users',
    '/api/admin/orders',
    '/api/admin/security/other',
    '/api/admin/login/other',
    '/api/dashboard',
  ])('not exempt: %s', (path) => expect(is2faExemptPath(path)).toBe(false));
});

describe('adminNeeds2faSetup', () => {
  it('is false whenever enforcement is off', () => {
    expect(adminNeeds2faSetup({ role: 'ADMIN' })).toBe(false);
    expect(adminNeeds2faSetup({ role: 'ADMIN', twoFactorEnabled: false })).toBe(false);
  });

  it('with enforcement on: ADMIN without the claim or with false needs setup; true or CUSTOMER does not', () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(adminNeeds2faSetup({ role: 'ADMIN' })).toBe(true);
    expect(adminNeeds2faSetup({ role: 'ADMIN', twoFactorEnabled: false })).toBe(true);
    expect(adminNeeds2faSetup({ role: 'ADMIN', twoFactorEnabled: 'true' })).toBe(true);
    expect(adminNeeds2faSetup({ role: 'ADMIN', twoFactorEnabled: true })).toBe(false);
    expect(adminNeeds2faSetup({ role: 'CUSTOMER' })).toBe(false);
    expect(adminNeeds2faSetup(null)).toBe(false);
  });
});

// ---- proxy() -----------------------------------------------------------------------
describe('proxy()', () => {
  it('enforcement off: an admin without 2FA reaches /admin/dashboard', async () => {
    expect(passesProxy(await proxy(pageReq('/admin/dashboard', legacyAdminToken())))).toBe(true);
  });

  it('enforcement on: admin token without the claim is redirected (302) to /admin/security?reason=2fa-required', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const res = await proxy(pageReq('/admin/dashboard', legacyAdminToken()));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://tapvyo.in/admin/security?reason=2fa-required');
  });

  it('enforcement on: admin token with twoFactorEnabled:false is redirected too', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const token = mintAdminSessionToken({ id: 'admin6', email: 'admin6@tapvyo.in', role: 'ADMIN', twoFactorEnabled: false });
    expect((await proxy(pageReq('/admin/orders', token))).status).toBe(302);
  });

  it('enforcement on: enrolled admin passes', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(passesProxy(await proxy(pageReq('/admin/dashboard', enrolledToken())))).toBe(true);
  });

  it('enforcement on: admin without 2FA can still open /admin/security', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(passesProxy(await proxy(pageReq('/admin/security', legacyAdminToken())))).toBe(true);
    expect(passesProxy(await proxy(pageReq('/admin/security?reason=2fa-required', legacyAdminToken())))).toBe(true);
  });

  it('enforcement on: customer and anonymous behaviour unchanged', async () => {
    for (const on of [false, true]) {
      if (on) process.env.ADMIN_2FA_REQUIRED = 'true';
      const cust = await proxy(pageReq('/admin/dashboard', customerToken()));
      expect(cust.headers.get('location')).toBe('https://tapvyo.in/unauthorized');
      const anon = await proxy(pageReq('/admin/dashboard'));
      expect(anon.headers.get('location')).toContain('/admin/login?redirect=');
      expect(passesProxy(await proxy(pageReq('/dashboard', customerToken())))).toBe(true);
    }
  });
});

// ---- withAdmin() -------------------------------------------------------------------
describe('withAdmin()', () => {
  it('enforcement off: admin without 2FA reaches the handler; no-session and customer unchanged', async () => {
    expect(await (await guarded(apiReq('/api/admin/users', legacyAdminToken()))).json()).toEqual({ reached: true });
    expect((await guarded(apiReq('/api/admin/users', customerToken()))).status).toBe(403);
    const anon = await guarded(new NextRequest('https://tapvyo.in/api/admin/users'));
    expect(anon.status).toBe(401);
  });

  it('enforcement on: admin without the claim gets 403 "Two-factor authentication setup required"', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    for (const path of ['/api/admin/users', '/api/admin/orders']) {
      const res = await guarded(apiReq(path, legacyAdminToken()));
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        success: false,
        message: 'Two-factor authentication setup required',
        error: 'Two-factor authentication setup required',
      });
    }
  });

  it('enforcement on: exempt 2FA API still passes for an admin without 2FA', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const res = await guarded(apiReq('/api/admin/security/2fa/status', legacyAdminToken()));
    expect(await res.json()).toEqual({ reached: true });
  });

  it('enforcement on: enrolled admin passes; customer gets the old 403', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    expect(await (await guarded(apiReq('/api/admin/users', enrolledToken()))).json()).toEqual({ reached: true });
    const cust = await guarded(apiReq('/api/admin/users', customerToken()));
    expect(await cust.json()).toEqual({ error: 'Access denied. Admin privileges required.' });
  });

  it('checks the same token authenticate() used (Bearer wins over cookie)', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const req = new NextRequest('https://tapvyo.in/api/admin/users', {
      headers: { authorization: `Bearer ${legacyAdminToken()}`, cookie: `auth-token=${enrolledToken()}` },
    });
    expect((await guarded(req)).status).toBe(403);
  });
});

// ---- mintAdminSessionToken() ---------------------------------------------------------
describe('mintAdminSessionToken()', () => {
  it('verifies with verifyToken (jsonwebtoken) AND jose (proxy) and carries the claim', async () => {
    for (const enabled of [true, false]) {
      const token = mintAdminSessionToken({ id: 'a1', email: 'a@tapvyo.in', role: 'ADMIN', twoFactorEnabled: enabled });
      const viaJwt = verifyToken(token) as unknown as Record<string, unknown>;
      expect(viaJwt).toMatchObject({ userId: 'a1', email: 'a@tapvyo.in', role: 'ADMIN', twoFactorEnabled: enabled });
      const { payload, protectedHeader } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      expect(protectedHeader.alg).toBe('HS256');
      expect(payload).toMatchObject({ userId: 'a1', twoFactorEnabled: enabled });
    }
  });

  it('a missing or non-true flag becomes twoFactorEnabled: false', () => {
    const token = mintAdminSessionToken({ id: 'a1', email: 'a@tapvyo.in', role: 'ADMIN' });
    expect((jwt.decode(token) as Record<string, unknown>).twoFactorEnabled).toBe(false);
  });

  it('expiry follows JWT_EXPIRES_IN, defaulting to 7 days', () => {
    const lifetime = () => {
      const p = jwt.decode(mintAdminSessionToken({ id: 'a1', email: 'a@tapvyo.in', role: 'ADMIN' })) as { iat: number; exp: number };
      return p.exp - p.iat;
    };
    expect(lifetime()).toBe(WEEK);
    process.env.JWT_EXPIRES_IN = '1h';
    expect(lifetime()).toBe(3600);
  });

  it('an enrolled-admin token passes proxy and withAdmin under enforcement', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const token = enrolledToken();
    expect(passesProxy(await proxy(pageReq('/admin/users', token)))).toBe(true);
    expect((await guarded(apiReq('/api/admin/users', token))).status).toBe(200);
  });
});

// ---- re-issue on confirm / disable ------------------------------------------------------
describe('session re-issue after confirm / disable', () => {
  beforeEach(() => {
    // Pin the clock 10 s into a 30 s step (otplib reads Date.now() too).
    const fixed = Math.floor(Date.now() / STEP_MS) * STEP_MS + 10_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixed);
  });

  it('confirm: same body, plus three session cookies whose token says twoFactorEnabled: true', async () => {
    admin = makeAdmin({ twoFactorSecret: encryptSecret(SECRET) });
    const res = await confirm(apiReq('/api/admin/security/2fa/confirm', legacyAdminToken(), { code: authenticator.generate(SECRET) }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(['backupCodes', 'ok']);
    expect(body.ok).toBe(true);
    expect(body.backupCodes).toHaveLength(10);
    const token = expectSessionCookies(res);
    expect(verifyToken(token)).toMatchObject({ userId: 'admin6', email: 'admin6@tapvyo.in', role: 'ADMIN', twoFactorEnabled: true });
    expect(admin.twoFactorEnabled).toBe(true);
  });

  it('a failed confirm issues no session cookies', async () => {
    admin = makeAdmin({ twoFactorSecret: encryptSecret(SECRET) });
    const res = await confirm(apiReq('/api/admin/security/2fa/confirm', legacyAdminToken(), { code: '000000' === authenticator.generate(SECRET) ? '111111' : '000000' }));
    expect(res.status).toBe(400);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it('disable: same body, plus three session cookies whose token says twoFactorEnabled: false', async () => {
    admin = makeAdmin({ twoFactorEnabled: true, twoFactorSecret: encryptSecret(SECRET) });
    const res = await disable(apiReq('/api/admin/security/2fa/disable', enrolledToken(), { password: PASSWORD, code: authenticator.generate(SECRET) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: '2FA disabled' });
    const token = expectSessionCookies(res);
    expect(verifyToken(token)).toMatchObject({ userId: 'admin6', role: 'ADMIN', twoFactorEnabled: false });
    // The pending-cookie clear from Step 5 is still there.
    expect(cookiesOf(res)['admin-2fa-pending']).toBeDefined();
  });

  it('a failed disable issues no session cookies', async () => {
    admin = makeAdmin({ twoFactorEnabled: true, twoFactorSecret: encryptSecret(SECRET) });
    const res = await disable(apiReq('/api/admin/security/2fa/disable', enrolledToken(), { password: 'wrong', code: authenticator.generate(SECRET) }));
    expect(res.status).toBe(401);
    expect(Object.keys(cookiesOf(res))).toEqual(['admin-2fa-pending']);
  });
});

// ---- regression: no-2FA password login --------------------------------------------------
describe('regression: no-2FA admin password login', () => {
  it('same cookies, flags, maxAge and body keys; token verifies and says twoFactorEnabled: false', async () => {
    const res = await passwordLogin(new NextRequest('https://tapvyo.in/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.66' },
      body: JSON.stringify({ email: admin.email, password: PASSWORD }),
    }));
    expect(res.status).toBe(200);
    const token = expectSessionCookies(res);
    expect(Object.keys(cookiesOf(res)).sort()).toEqual(['admin-token', 'auth-token', 'token']);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(['data', 'message', 'success', 'token', 'user']);
    expect(body.token).toBe(token);
    expect(Object.keys(body.user).sort()).toEqual(['avatar', 'email', 'id', 'name', 'phone', 'role']);
    expect(verifyToken(token)).toMatchObject({ userId: 'admin6', email: 'admin6@tapvyo.in', role: 'ADMIN', twoFactorEnabled: false });
  });
});
