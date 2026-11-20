import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

/**
 * Step 4 - two-step admin login (/api/admin/login + /api/admin/login/2fa).
 *
 * Real: both route handlers, the shared limiter (its MongoDB collection is an
 * in-memory fake, as in admin-login-rate-limit.test.ts), proxy(),
 * authenticate(), the AES-GCM helper, otplib and bcrypt.
 * Fake: Prisma - an in-memory user store whose updateMany enforces the same
 * compare-and-set conditions the routes rely on (step OR filter, whole-array
 * equals).
 */

process.env.JWT_SECRET = 'test-jwt-secret-step4';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');

const PASSWORD = 'Admin-pass-123';
const STEP_MS = 30_000;

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
  twoFactorLastUsedStep?: number | null;
};

let users: User[] = [];

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
type StepCond = null | { isSet?: boolean; lt?: number };
function stepMatches(u: User, cond: StepCond): boolean {
  if (cond === null) return u.twoFactorLastUsedStep === null;
  if (cond.isSet === false) return u.twoFactorLastUsedStep === undefined;
  if (typeof cond.lt === 'number') return typeof u.twoFactorLastUsedStep === 'number' && u.twoFactorLastUsedStep < cond.lt;
  return false;
}

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        const u = users.find((x) => (where.id ? x.id === where.id : x.email === where.email));
        return u ? structuredClone(u) : null;
      }),
      updateMany: vi.fn(async ({ where, data }: {
        where: { id: string; twoFactorEnabled?: boolean; OR?: { twoFactorLastUsedStep: StepCond }[]; twoFactorBackupCodes?: { equals: string[] } };
        data: { twoFactorLastUsedStep?: number; twoFactorBackupCodes?: { set: string[] } };
      }) => {
        // Yield first, so parallel requests both read before either writes;
        // the check-and-write below then runs as one uninterrupted step,
        // like MongoDB's single-document update.
        await new Promise((r) => setTimeout(r, 5));
        const u = users.find((x) => x.id === where.id);
        if (!u) return { count: 0 };
        if (where.twoFactorEnabled !== undefined && u.twoFactorEnabled !== where.twoFactorEnabled) return { count: 0 };
        if (where.OR && !where.OR.some((c) => stepMatches(u, c.twoFactorLastUsedStep))) return { count: 0 };
        if (where.twoFactorBackupCodes && JSON.stringify(u.twoFactorBackupCodes) !== JSON.stringify(where.twoFactorBackupCodes.equals)) {
          return { count: 0 };
        }
        if (data.twoFactorLastUsedStep !== undefined) u.twoFactorLastUsedStep = data.twoFactorLastUsedStep;
        if (data.twoFactorBackupCodes) u.twoFactorBackupCodes = [...data.twoFactorBackupCodes.set];
        return { count: 1 };
      }),
    },
  },
}));

const { encryptSecret } = await import('@/lib/two-factor-crypto');
const { generateBackupCodes, hashBackupCodes } = await import('@/lib/two-factor');
const { mintPendingToken, PENDING_COOKIE_NAME } = await import('@/lib/admin-2fa-pending');
const { authenticate } = await import('@/lib/auth-middleware');
const { POST: passwordLogin } = await import('../app/api/admin/login/route');
const { POST: verify2fa } = await import('../app/api/admin/login/2fa/route');
const { GET: twoFaStatus } = await import('../app/api/admin/security/2fa/status/route');
const { proxy } = await import('../proxy');
const { NextRequest } = await import('next/server');

// ---- helpers -----------------------------------------------------------------
let ipCounter = 0;
const freshIp = () => `198.51.100.${++ipCounter % 250}`;

function loginReq(email: string, password: string, ip = freshIp()) {
  return new NextRequest('https://tapvyo.in/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, password }),
  });
}

function codeReq(code: string, pendingCookie?: string, ip = freshIp()) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': ip };
  if (pendingCookie) headers.cookie = `${PENDING_COOKIE_NAME}=${pendingCookie}`;
  return new NextRequest('https://tapvyo.in/api/admin/login/2fa', {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
}

/** Set-Cookie headers as { name -> { value, attrs } } with attribute names lower-cased. */
function cookiesOf(res: Response) {
  const out: Record<string, { value: string; attrs: Record<string, string | true> }> = {};
  for (const line of res.headers.getSetCookie()) {
    const [pair, ...rest] = line.split(';').map((s) => s.trim());
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq);
    const attrs: Record<string, string | true> = {};
    for (const a of rest) {
      const i = a.indexOf('=');
      if (i < 0) attrs[a.toLowerCase()] = true;
      else attrs[a.slice(0, i).toLowerCase()] = a.slice(i + 1).toLowerCase();
    }
    out[name] = { value: pair.slice(eq + 1), attrs };
  }
  return out;
}

const SECRET = authenticator.generateSecret(20);
const currentCode = () => authenticator.generate(SECRET);

function makeAdmin(overrides: Partial<User> = {}): User {
  return {
    id: 'admin-2fa',
    email: 'admin2fa@tapvyo.in',
    password: bcrypt.hashSync(PASSWORD, 4),
    name: 'Two Factor',
    role: 'ADMIN',
    isActive: true,
    phone: null,
    avatar: null,
    twoFactorEnabled: true,
    twoFactorSecret: encryptSecret(SECRET),
    twoFactorBackupCodes: [],
    twoFactorLastUsedStep: null,
    ...overrides,
  };
}

let backupCodes: string[] = [];

beforeEach(async () => {
  vi.restoreAllMocks();
  store.clear();
  // Pin the clock 10 s into a 30 s step: no test can straddle a step boundary.
  const fixed = Math.floor(Date.now() / STEP_MS) * STEP_MS + 10_000;
  vi.spyOn(Date, 'now').mockReturnValue(fixed);

  backupCodes = generateBackupCodes(10);
  users = [
    makeAdmin({ twoFactorBackupCodes: await hashBackupCodes(backupCodes) }),
    makeAdmin({
      id: 'admin-plain',
      email: 'plain@tapvyo.in',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorLastUsedStep: undefined,
    }),
  ];
});

// ---- tests -------------------------------------------------------------------
describe('POST /api/admin/login', () => {
  it('admin WITHOUT 2FA: unchanged single-step login - session cookies, no pending cookie', async () => {
    const res = await passwordLogin(loginReq('plain@tapvyo.in', PASSWORD));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, message: 'Login successful', user: { email: 'plain@tapvyo.in' } });
    expect(typeof body.token).toBe('string');

    const cookies = cookiesOf(res);
    expect(Object.keys(cookies).sort()).toEqual(['admin-token', 'auth-token', 'token']);
    expect(cookies[PENDING_COOKIE_NAME]).toBeUndefined();
  });

  it('admin WITH 2FA: { requires2fa: true } + pending cookie only, no session', async () => {
    const res = await passwordLogin(loginReq('admin2fa@tapvyo.in', PASSWORD));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ requires2fa: true });

    const cookies = cookiesOf(res);
    expect(Object.keys(cookies)).toEqual([PENDING_COOKIE_NAME]);
    const pending = cookies[PENDING_COOKIE_NAME];
    expect(pending.attrs).toMatchObject({ httponly: true, secure: true, samesite: 'lax', 'max-age': '300', path: '/api/admin/login' });
    expect(pending.value.length).toBeGreaterThan(20);
  });

  it('a wrong password for a 2FA admin is still the old 401, no pending cookie', async () => {
    const res = await passwordLogin(loginReq('admin2fa@tapvyo.in', 'wrong'));
    expect(res.status).toBe(401);
    expect(cookiesOf(res)[PENDING_COOKIE_NAME]).toBeUndefined();
  });
});

describe('the pending token is not a session', () => {
  it('proxy() sends /admin back to the login page with only the pending cookie', async () => {
    const res = await proxy(new NextRequest('https://tapvyo.in/admin/dashboard', {
      headers: { cookie: `${PENDING_COOKIE_NAME}=${mintPendingToken('admin-2fa')}` },
    }));
    expect([302, 307, 308]).toContain(res.status);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin/login');
  });

  it('proxy() also rejects it sent as a Bearer session token', async () => {
    const res = await proxy(new NextRequest('https://tapvyo.in/admin/dashboard', {
      headers: { authorization: `Bearer ${mintPendingToken('admin-2fa')}` },
    }));
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin/login');
  });

  it('an admin API refuses it, as a cookie and as Bearer', async () => {
    const asCookie = await twoFaStatus(new NextRequest('https://tapvyo.in/api/admin/security/2fa/status', {
      headers: { cookie: `${PENDING_COOKIE_NAME}=${mintPendingToken('admin-2fa')}` },
    }));
    const asBearer = await twoFaStatus(new NextRequest('https://tapvyo.in/api/admin/security/2fa/status', {
      headers: { authorization: `Bearer ${mintPendingToken('admin-2fa')}` },
    }));
    expect([401, 403]).toContain(asCookie.status);
    expect([401, 403]).toContain(asBearer.status);
  });

  it('authenticate() returns no user for it, even as Bearer', async () => {
    const { user } = await authenticate(new NextRequest('https://tapvyo.in/api/x', {
      headers: { authorization: `Bearer ${mintPendingToken('admin-2fa')}` },
    }));
    expect(user).toBeNull();
  });
});

describe('POST /api/admin/login/2fa', () => {
  async function pendingCookie(): Promise<string> {
    const res = await passwordLogin(loginReq('admin2fa@tapvyo.in', PASSWORD));
    return cookiesOf(res)[PENDING_COOKIE_NAME].value;
  }

  it('correct TOTP: the SAME session cookies and body shape as a no-2FA login; pending cleared', async () => {
    const plain = await passwordLogin(loginReq('plain@tapvyo.in', PASSWORD));
    const plainCookies = cookiesOf(plain);
    const plainBody = await plain.json();

    const res = await verify2fa(codeReq(currentCode(), await pendingCookie()));
    expect(res.status).toBe(200);
    const body = await res.json();
    const cookies = cookiesOf(res);

    // Same three session cookies with identical attributes (values differ).
    for (const name of ['auth-token', 'admin-token', 'token']) {
      expect(cookies[name]).toBeDefined();
      expect(cookies[name].attrs).toEqual(plainCookies[name].attrs);
    }
    // Same body keys, top level and inside `data`.
    expect(Object.keys(body).sort()).toEqual(Object.keys(plainBody).sort());
    expect(Object.keys(body.data).sort()).toEqual(Object.keys(plainBody.data).sort());
    expect(body).toMatchObject({ success: true, message: 'Login successful', user: { email: 'admin2fa@tapvyo.in', role: 'ADMIN' } });

    // The issued token is a real ADMIN session.
    const { user } = await authenticate(new NextRequest('https://tapvyo.in/api/x', {
      headers: { authorization: `Bearer ${body.token}` },
    }));
    expect(user).toMatchObject({ id: 'admin-2fa', role: 'ADMIN' });

    // Pending cookie cleared.
    expect(cookies[PENDING_COOKIE_NAME].attrs['max-age']).toBe('0');
    expect(cookies[PENDING_COOKIE_NAME].value).toBe('');
  });

  it('wrong code: generic 401, step unchanged, pending cookie kept', async () => {
    const cookie = await pendingCookie();
    const good = currentCode();
    const res = await verify2fa(codeReq(good === '000000' ? '111111' : '000000', cookie));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ success: false, message: 'Invalid code' });
    expect(cookiesOf(res)[PENDING_COOKIE_NAME]).toBeUndefined();
    expect(users[0].twoFactorLastUsedStep).toBeNull();
  });

  it('replay: the same TOTP a second time is a generic 401 (even with a captured pending cookie)', async () => {
    const cookie = await pendingCookie();
    const code = currentCode();
    expect((await verify2fa(codeReq(code, cookie))).status).toBe(200);

    const again = await verify2fa(codeReq(code, cookie));
    expect(again.status).toBe(401);
    expect(await again.json()).toMatchObject({ message: 'Invalid code' });
  });

  it('two parallel requests with the same TOTP step: exactly one succeeds', async () => {
    const cookie = await pendingCookie();
    const code = currentCode();
    const [a, b] = await Promise.all([verify2fa(codeReq(code, cookie)), verify2fa(codeReq(code, cookie))]);
    expect([a.status, b.status].sort()).toEqual([200, 401]);
  });

  it('backup code: works once, removed, second use is a generic 401', async () => {
    const cookie = await pendingCookie();
    const res = await verify2fa(codeReq(backupCodes[2], cookie));
    expect(res.status).toBe(200);
    expect(users[0].twoFactorBackupCodes).toHaveLength(9);

    const again = await verify2fa(codeReq(backupCodes[2], await pendingCookie()));
    expect(again.status).toBe(401);
    expect(await again.json()).toMatchObject({ message: 'Invalid code' });
    expect(users[0].twoFactorBackupCodes).toHaveLength(9);
  });

  it('two parallel requests spending two DIFFERENT backup codes cannot resurrect either', async () => {
    const cookie = await pendingCookie();
    const [a, b] = await Promise.all([
      verify2fa(codeReq(backupCodes[0], cookie)),
      verify2fa(codeReq(backupCodes[1], cookie)),
    ]);
    // The whole-array compare-and-set lets one win; the other must retry.
    expect([a.status, b.status].sort()).toEqual([200, 401]);
    expect(users[0].twoFactorBackupCodes).toHaveLength(9);
  });

  it('missing pending cookie: generic 401 and the cookie is cleared', async () => {
    const res = await verify2fa(codeReq(currentCode()));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ message: 'Invalid code' });
    expect(cookiesOf(res)[PENDING_COOKIE_NAME].attrs['max-age']).toBe('0');
  });

  it('expired pending cookie: generic 401 and cleared', async () => {
    const cookie = mintPendingToken('admin-2fa');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 301_000);
    const res = await verify2fa(codeReq(currentCode(), cookie));
    expect(res.status).toBe(401);
    expect(cookiesOf(res)[PENDING_COOKIE_NAME].attrs['max-age']).toBe('0');
  });

  it('a SESSION token placed in the pending cookie is refused', async () => {
    const plain = await passwordLogin(loginReq('plain@tapvyo.in', PASSWORD));
    const sessionToken = (await plain.json()).token as string;
    const res = await verify2fa(codeReq(currentCode(), sessionToken));
    expect(res.status).toBe(401);
  });

  it('2FA switched off between the two steps: generic 401, cookie cleared', async () => {
    const cookie = await pendingCookie();
    users[0].twoFactorEnabled = false;
    const res = await verify2fa(codeReq(currentCode(), cookie));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ message: 'Invalid code' });
    expect(cookiesOf(res)[PENDING_COOKIE_NAME].attrs['max-age']).toBe('0');
  });

  it('IP limit fires even with no cookie at all: the 6th request is 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await verify2fa(codeReq('123456', undefined, '203.0.113.9'))).status);
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });

  it('per-admin limit runs before the code: after 5 wrong codes even the right one is 429', async () => {
    const cookie = await pendingCookie();
    const good = currentCode();
    const wrong = good === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) expect((await verify2fa(codeReq(wrong, cookie))).status).toBe(401);

    const blocked = await verify2fa(codeReq(good, cookie));
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toMatchObject({ message: 'Too many login attempts. Please try again later.' });
    expect(users[0].twoFactorLastUsedStep).toBeNull();
    // The cookie is not cleared on a 429.
    expect(cookiesOf(blocked)[PENDING_COOKIE_NAME]).toBeUndefined();
  });
});
