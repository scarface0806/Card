import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

/**
 * Step 7 - the whole admin 2FA lifecycle, end to end, in-process.
 *
 * Every request goes through the REAL route handlers / proxy() / withAdmin(),
 * one after another against ONE in-memory admin record, so state carries
 * through a lifecycle exactly as it would in the database:
 *   start -> confirm -> password login -> code -> session -> regenerate ->
 *   disable -> password-only login.
 *
 * Real: all routes, proxy(), withAdmin()/authenticate(), the shared limiter
 * (counters kept in an in-memory rate_limits stand-in, same pattern as
 * tests/admin-login-rate-limit.test.ts - never a stub that always says ok),
 * AES-256-GCM, otplib, bcrypt, jsonwebtoken and jose.
 * Fake: Prisma - an in-memory user store whose updateMany enforces the same
 * compare-and-set conditions the routes rely on (TOTP step OR filter,
 * whole-array equals on backup codes, password hash, twoFactorEnabled).
 *
 * The clock is a variable: TOTP codes, JWT expiry and the limiter windows
 * all read Date.now(), so each test moves time forward explicitly.
 */

process.env.JWT_SECRET = 'test-jwt-secret-step7';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');

const PASSWORD = 'Admin-pass-123';
const EMAIL = 'e2e-admin@tapvyo.in';
const STEP_MS = 30_000;
const WEEK = 60 * 60 * 24 * 7;
const SETUP = 'Two-factor authentication setup required';

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

let admin: User;

// ---- clock -------------------------------------------------------------------------
let now = 0;
const advance = (ms: number) => {
  now += ms;
};
/** Move to the start of the next 30 s TOTP step (+10 s), so a new code is "fresh". */
const nextStep = () => {
  now = (Math.floor(now / STEP_MS) + 1) * STEP_MS + 10_000;
};

// ---- rate_limits stand-in (real limiter logic runs on top) ----------------------------
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
    let deletedCount = 0;
    for (const id of filter._id.$in) if (store.delete(id)) deletedCount++;
    return { deletedCount };
  }),
};
vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => ({ collection: () => collection })),
}));

// ---- Prisma stand-in -------------------------------------------------------------------
type StepCond = null | { isSet?: boolean; lt?: number };
function stepMatches(u: User, cond: StepCond): boolean {
  if (cond === null) return u.twoFactorLastUsedStep === null;
  if (cond.isSet === false) return u.twoFactorLastUsedStep === undefined;
  if (typeof cond.lt === 'number') return typeof u.twoFactorLastUsedStep === 'number' && u.twoFactorLastUsedStep < cond.lt;
  return false;
}

/** Apply a Prisma `data` object: plain values, or { set: [...] } for the array. */
function applyData(data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    const v = value && typeof value === 'object' && !Array.isArray(value) && 'set' in value
      ? [...(value as { set: string[] }).set]
      : Array.isArray(value) ? [...value] : value;
    (admin as Record<string, unknown>)[key] = v;
  }
}

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        const hit = where.id ? where.id === admin.id : where.email === admin.email;
        return hit ? structuredClone(admin) : null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        if (where.id !== admin.id) throw new Error('Record not found');
        applyData(data);
        return structuredClone(admin);
      }),
      updateMany: vi.fn(async ({ where, data }: {
        where: {
          id: string;
          twoFactorEnabled?: boolean;
          password?: string;
          OR?: { twoFactorLastUsedStep: StepCond }[];
          twoFactorBackupCodes?: { equals: string[] };
        };
        data: Record<string, unknown>;
      }) => {
        // Yield first, so parallel requests both read before either writes;
        // the check-and-write below then runs as one uninterrupted step, like
        // MongoDB's single-document update.
        await new Promise((r) => setTimeout(r, 5));
        if (where.id !== admin.id) return { count: 0 };
        if (where.twoFactorEnabled !== undefined && admin.twoFactorEnabled !== where.twoFactorEnabled) return { count: 0 };
        if (where.password !== undefined && admin.password !== where.password) return { count: 0 };
        if (where.OR && !where.OR.some((c) => stepMatches(admin, c.twoFactorLastUsedStep))) return { count: 0 };
        if (where.twoFactorBackupCodes && JSON.stringify(admin.twoFactorBackupCodes) !== JSON.stringify(where.twoFactorBackupCodes.equals)) {
          return { count: 0 };
        }
        applyData(data);
        return { count: 1 };
      }),
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 1),
    },
  },
}));

const { decryptSecret } = await import('@/lib/two-factor-crypto');
const { generateToken, verifyToken } = await import('@/lib/auth');
const { PENDING_COOKIE_NAME, PENDING_AUDIENCE } = await import('@/lib/admin-2fa-pending');
const { POST: start } = await import('../app/api/admin/security/2fa/start/route');
const { POST: confirm } = await import('../app/api/admin/security/2fa/confirm/route');
const { POST: regenerate } = await import('../app/api/admin/security/2fa/backup-codes/regenerate/route');
const { POST: disable } = await import('../app/api/admin/security/2fa/disable/route');
const { GET: twoFaStatus } = await import('../app/api/admin/security/2fa/status/route');
const { POST: passwordLogin } = await import('../app/api/admin/login/route');
const { POST: codeLogin } = await import('../app/api/admin/login/2fa/route');
const { GET: listUsers } = await import('../app/api/admin/users/route');
const { proxy } = await import('../proxy');
const { NextRequest } = await import('next/server');

// ---- request helpers ---------------------------------------------------------------------
let ipCounter = 0;
const freshIp = () => `198.18.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

function post(path: string, body: unknown, opts: { session?: string; pending?: string; ip?: string; bearer?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': opts.ip ?? freshIp() };
  const cookies: string[] = [];
  if (opts.session) cookies.push(`auth-token=${opts.session}`);
  if (opts.pending) cookies.push(`${PENDING_COOKIE_NAME}=${opts.pending}`);
  if (cookies.length) headers.cookie = cookies.join('; ');
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`;
  return new NextRequest(`https://tapvyo.in${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

function get(path: string, opts: { session?: string; pending?: string; bearer?: string } = {}) {
  const headers: Record<string, string> = { 'x-forwarded-for': freshIp() };
  const cookies: string[] = [];
  if (opts.session) cookies.push(`auth-token=${opts.session}`);
  if (opts.pending) cookies.push(`${PENDING_COOKIE_NAME}=${opts.pending}`);
  if (cookies.length) headers.cookie = cookies.join('; ');
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`;
  return new NextRequest(`https://tapvyo.in${path}`, { headers });
}

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

const SESSION_COOKIES = ['auth-token', 'admin-token', 'token'];

/** Asserts the three session cookies (same token, same flags) and returns the token. */
function sessionTokenOf(res: Response): string {
  const cookies = cookiesOf(res);
  const values = SESSION_COOKIES.map((name) => {
    const c = cookies[name];
    expect(c, name).toBeDefined();
    expect(c.attrs.httponly).toBe(true);
    expect(c.attrs.samesite).toBe('lax');
    expect(c.attrs['max-age']).toBe(String(WEEK));
    expect(c.attrs.path).toBe('/');
    return c.value;
  });
  expect(new Set(values).size).toBe(1);
  return values[0];
}

const hasSessionCookies = (res: Response) => SESSION_COOKIES.some((n) => n in cookiesOf(res));
const pendingCleared = (res: Response) => cookiesOf(res)[PENDING_COOKIE_NAME]?.attrs['max-age'] === '0';

/** Session for the admin as it is right now (what they hold before enrolling). */
const preEnrolSession = () => generateToken({ userId: admin.id, email: admin.email, role: 'ADMIN' });
const totpNow = () => authenticator.generate(decryptSecret(admin.twoFactorSecret!));

/** Password step; returns the pending token. */
async function passwordStep(ip = freshIp()): Promise<string> {
  const res = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }, { ip }));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ requires2fa: true });
  expect(hasSessionCookies(res)).toBe(false);
  const pending = cookiesOf(res)[PENDING_COOKIE_NAME];
  expect(pending?.value).toBeTruthy();
  return pending.value;
}

/** start + confirm; returns the backup codes. */
async function enrol(): Promise<string[]> {
  const session = preEnrolSession();
  const s = await start(post('/api/admin/security/2fa/start', {}, { session }));
  expect(s.status).toBe(200);
  const c = await confirm(post('/api/admin/security/2fa/confirm', { code: totpNow() }, { session }));
  expect(c.status).toBe(200);
  return (await c.json()).backupCodes;
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Start 10 s into a 30 s step, 1 s into a 15 min limiter window.
  now = Math.floor(Date.now() / 900_000) * 900_000 + 10_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  store.clear();
  delete process.env.ADMIN_2FA_REQUIRED;
  admin = {
    id: 'e2e-admin',
    email: EMAIL,
    password: bcrypt.hashSync(PASSWORD, 4),
    name: 'E2E Admin',
    role: 'ADMIN',
    isActive: true,
    phone: null,
    avatar: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: [],
    twoFactorLastUsedStep: null,
  };
});

// ---- a. enrolment -> login -> verify ---------------------------------------------------------
describe('a. enrolment -> password -> code -> session', () => {
  it('runs the full happy path', async () => {
    // Shape of a no-2FA login, to compare against at the end.
    const plain = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }));
    expect(plain.status).toBe(200);
    const plainKeys = Object.keys(await plain.json()).sort();
    store.clear();

    const session = preEnrolSession();

    const s = await start(post('/api/admin/security/2fa/start', {}, { session }));
    expect(s.status).toBe(200);
    const started = await s.json();
    expect(started.otpauthUrl).toMatch(/^otpauth:\/\/totp\/Tapvyo:/);
    expect(started.secretPreview).toBeTruthy();
    expect(started.otpauthUrl).toContain(`secret=${started.secretPreview}`);
    // Stored encrypted, never in clear.
    expect(admin.twoFactorSecret).not.toContain(started.secretPreview);
    expect(decryptSecret(admin.twoFactorSecret!)).toBe(started.secretPreview);
    expect(admin.twoFactorEnabled).toBe(false);

    const c = await confirm(post('/api/admin/security/2fa/confirm', { code: totpNow() }, { session }));
    expect(c.status).toBe(200);
    const confirmed = await c.json();
    expect(confirmed.ok).toBe(true);
    expect(confirmed.backupCodes).toHaveLength(10);
    expect(admin.twoFactorEnabled).toBe(true);
    // Only hashes are stored.
    for (const code of confirmed.backupCodes) expect(admin.twoFactorBackupCodes).not.toContain(code);

    // Codes are shown once: nothing else returns them.
    const st = await twoFaStatus(get('/api/admin/security/2fa/status', { session }));
    expect(await st.json()).toEqual({ enabled: true });

    const pending = await passwordStep();

    nextStep();
    const v = await codeLogin(post('/api/admin/login/2fa', { code: totpNow() }, { pending }));
    expect(v.status).toBe(200);
    const token = sessionTokenOf(v);
    expect(pendingCleared(v)).toBe(true);
    const body = await v.json();
    expect(Object.keys(body).sort()).toEqual(plainKeys);
    expect(body.token).toBe(token);
    expect(verifyToken(token)).toMatchObject({ userId: admin.id, role: 'ADMIN', twoFactorEnabled: true });
  });
});

// ---- b. backup codes -------------------------------------------------------------------------------
describe('b. backup-code lifecycle', () => {
  it('one code logs in once; regenerate replaces every old code', async () => {
    const codes = await enrol();
    expect(codes).toHaveLength(10);

    const first = await codeLogin(post('/api/admin/login/2fa', { code: codes[0] }, { pending: await passwordStep() }));
    expect(first.status).toBe(200);
    expect(admin.twoFactorBackupCodes).toHaveLength(9);

    const again = await codeLogin(post('/api/admin/login/2fa', { code: codes[0] }, { pending: await passwordStep() }));
    expect(again.status).toBe(401);
    expect((await again.json()).message).toBe('Invalid code');

    // Regenerate with password + a current TOTP.
    nextStep();
    const session = sessionTokenOf(first);
    const r = await regenerate(post('/api/admin/security/2fa/backup-codes/regenerate', { password: PASSWORD, code: totpNow() }, { session }));
    expect(r.status).toBe(200);
    const fresh: string[] = (await r.json()).backupCodes;
    expect(fresh).toHaveLength(10);
    expect(admin.twoFactorBackupCodes).toHaveLength(10);

    // An old, never-used code no longer works...
    const old = await codeLogin(post('/api/admin/login/2fa', { code: codes[5] }, { pending: await passwordStep() }));
    expect(old.status).toBe(401);
    // ...a new one does.
    const ok = await codeLogin(post('/api/admin/login/2fa', { code: fresh[5] }, { pending: await passwordStep() }));
    expect(ok.status).toBe(200);
  });
});

// ---- c. disable ----------------------------------------------------------------------------------------
describe('c. disable flow', () => {
  it('clears all four fields; the next login is password-only', async () => {
    await enrol();
    nextStep();
    const login = await codeLogin(post('/api/admin/login/2fa', { code: totpNow() }, { pending: await passwordStep() }));
    const session = sessionTokenOf(login);

    nextStep();
    const d = await disable(post('/api/admin/security/2fa/disable', { password: PASSWORD, code: totpNow() }, { session }));
    expect(d.status).toBe(200);
    expect(await d.json()).toEqual({ success: true, message: '2FA disabled' });
    expect(pendingCleared(d)).toBe(true);
    expect(admin).toMatchObject({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      twoFactorLastUsedStep: null,
    });
    // The re-issued session says so too.
    expect(verifyToken(sessionTokenOf(d))).toMatchObject({ twoFactorEnabled: false });

    const next = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }));
    expect(next.status).toBe(200);
    expect(await next.json()).not.toHaveProperty('requires2fa');
    expect(PENDING_COOKIE_NAME in cookiesOf(next)).toBe(false);
    expect(verifyToken(sessionTokenOf(next))).toMatchObject({ role: 'ADMIN', twoFactorEnabled: false });
  });
});

// ---- d. enforcement ------------------------------------------------------------------------------------
describe('d. ADMIN_2FA_REQUIRED', () => {
  async function check(session: string) {
    const users = await listUsers(get('/api/admin/users', { session }));
    const status = await twoFaStatus(get('/api/admin/security/2fa/status', { session }));
    const page = await proxy(get('/admin/dashboard', { session }));
    return {
      users: { status: users.status, body: await users.json() },
      status: status.status,
      page: { status: page.status, location: page.headers.get('location'), next: page.headers.get('x-middleware-next') === '1' },
    };
  }

  it('on: admin without 2FA is limited to /admin/security', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    // A fresh no-2FA login, as an admin would get it today.
    const login = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }));
    const r = await check(sessionTokenOf(login));
    expect(r.users).toEqual({ status: 403, body: { success: false, message: SETUP, error: SETUP } });
    expect(r.status).toBe(200);
    expect(r.page.status).toBe(302);
    expect(r.page.location).toBe('https://tapvyo.in/admin/security?reason=2fa-required');
    expect((await proxy(get('/admin/security', { session: sessionTokenOf(login) }))).headers.get('x-middleware-next')).toBe('1');
  });

  it('on: enrolling re-issues the session, which then passes everywhere', async () => {
    process.env.ADMIN_2FA_REQUIRED = 'true';
    const session = preEnrolSession();
    await start(post('/api/admin/security/2fa/start', {}, { session }));
    const c = await confirm(post('/api/admin/security/2fa/confirm', { code: totpNow() }, { session }));
    const r = await check(sessionTokenOf(c));
    expect(r.users.status).toBe(200);
    expect(r.users.body).toHaveProperty('users');
    expect(r.page.next).toBe(true);
  });

  it('on: a session from the two-step login passes everywhere', async () => {
    await enrol();
    process.env.ADMIN_2FA_REQUIRED = 'true';
    nextStep();
    const login = await codeLogin(post('/api/admin/login/2fa', { code: totpNow() }, { pending: await passwordStep() }));
    const r = await check(sessionTokenOf(login));
    expect(r.users.status).toBe(200);
    expect(r.page.next).toBe(true);
  });

  it('unset: the guard is a no-op for the same admin without 2FA', async () => {
    const login = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }));
    const r = await check(sessionTokenOf(login));
    expect(r.users.status).toBe(200);
    expect(r.status).toBe(200);
    expect(r.page.next).toBe(true);
    // Same for a pre-Step-6 token with no claim at all.
    const legacy = await check(preEnrolSession());
    expect(legacy.users.status).toBe(200);
    expect(legacy.page.next).toBe(true);
  });
});

// ---- e. rate limits ----------------------------------------------------------------------------------------
describe('e. rate limits (real counters)', () => {
  it('6th password attempt in a minute for the same email + IP is 429', async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      const res = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: 'wrong' }, { ip }));
      expect(res.status).toBe(401);
    }
    const sixth = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }, { ip }));
    expect(sixth.status).toBe(429);
    expect((await sixth.json()).message).toBe('Too many login attempts. Please try again later.');
    expect(hasSessionCookies(sixth)).toBe(false);
  });

  it('6th code submission in a minute for the same pending cookie is 429', async () => {
    await enrol();
    const ip = freshIp();
    const pending = await passwordStep(ip);
    const wrong = totpNow() === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      const res = await codeLogin(post('/api/admin/login/2fa', { code: wrong }, { pending, ip }));
      expect(res.status).toBe(401);
    }
    nextStep();
    // Still inside the sliding minute; even a correct code is refused.
    now -= 10_000;
    const sixth = await codeLogin(post('/api/admin/login/2fa', { code: totpNow() }, { pending, ip }));
    expect(sixth.status).toBe(429);
    expect(hasSessionCookies(sixth)).toBe(false);
  });

  it('10 failures spaced 20 s apart lock the email + IP pair; the counter reads 10', async () => {
    const ip = freshIp();
    for (let i = 0; i < 10; i++) {
      const res = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: `wrong-${i}` }, { ip }));
      expect(res.status, `failure ${i + 1}`).toBe(401);
      advance(20_000);
    }
    const pairKey = `${createHash('sha256').update(EMAIL).digest('hex')}:${ip}`;
    const pairCount = [...store.values()]
      .filter((d) => d._id.startsWith(`admin-login-fail-pair:lockout:${pairKey}:`))
      .reduce((sum, d) => sum + d.count, 0);
    expect(pairCount).toBe(10);

    const locked = await passwordLogin(post('/api/admin/login', { email: EMAIL, password: PASSWORD }, { ip }));
    expect(locked.status).toBe(429);
    expect(hasSessionCookies(locked)).toBe(false);
  });
});

// ---- f. the pending cookie is not a session ----------------------------------------------------------------
describe('f. pending cookie', () => {
  it('cannot reach an admin API or page, as a cookie or as a Bearer token', async () => {
    await enrol();
    const pending = await passwordStep();

    const api = await listUsers(get('/api/admin/users', { pending }));
    expect([401, 403]).toContain(api.status);

    const bearer = await listUsers(get('/api/admin/users', { bearer: pending }));
    expect([401, 403]).toContain(bearer.status);
    expect(verifyToken(pending)).toBeNull();

    const page = await proxy(get('/admin/dashboard', { pending }));
    expect(page.status).toBeGreaterThanOrEqual(300);
    expect(page.headers.get('location')).toContain('/admin/login');

    const pageBearer = await proxy(get('/admin/dashboard', { bearer: pending }));
    expect(pageBearer.headers.get('location')).toContain('/admin/login');
  });

  it('an expired pending token gets 401 "Invalid code" and is cleared', async () => {
    await enrol();
    // Minted exactly like mintPendingToken, but with a 1 s lifetime.
    const key = createHmac('sha256', process.env.JWT_SECRET!).update('tapvyo:admin-2fa-pending').digest();
    const shortLived = jwt.sign({ sub: admin.id, purpose: '2fa-pending' }, key, {
      algorithm: 'HS256',
      audience: PENDING_AUDIENCE,
      expiresIn: 1,
    });
    nextStep();
    const code = totpNow();
    advance(2_000);
    const res = await codeLogin(post('/api/admin/login/2fa', { code }, { pending: shortLived }));
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe('Invalid code');
    expect(pendingCleared(res)).toBe(true);
    expect(hasSessionCookies(res)).toBe(false);
  });
});

// ---- g. atomicity ------------------------------------------------------------------------------------------------
describe('g. concurrency', () => {
  it('the same TOTP submitted twice in parallel logs in exactly once', async () => {
    await enrol();
    const [p1, p2] = [await passwordStep(), await passwordStep()];
    nextStep();
    const code = totpNow();
    const results = await Promise.all([
      codeLogin(post('/api/admin/login/2fa', { code }, { pending: p1 })),
      codeLogin(post('/api/admin/login/2fa', { code }, { pending: p2 })),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(results.filter(hasSessionCookies)).toHaveLength(1);
  });

  it('two DIFFERENT backup codes in parallel: one wins, the loser is not consumed', async () => {
    const codes = await enrol();
    const [p1, p2] = [await passwordStep(), await passwordStep()];
    const results = await Promise.all([
      codeLogin(post('/api/admin/login/2fa', { code: codes[1] }, { pending: p1 })),
      codeLogin(post('/api/admin/login/2fa', { code: codes[2] }, { pending: p2 })),
    ]);
    const statuses = results.map((r) => r.status);
    expect(statuses.sort()).toEqual([200, 401]);
    expect(admin.twoFactorBackupCodes).toHaveLength(9);

    // The losing code is still valid; the winning one is spent.
    const loser = results[0].status === 401 ? codes[1] : codes[2];
    const winner = loser === codes[1] ? codes[2] : codes[1];
    const retry = await codeLogin(post('/api/admin/login/2fa', { code: loser }, { pending: await passwordStep() }));
    expect(retry.status).toBe(200);
    const reuse = await codeLogin(post('/api/admin/login/2fa', { code: winner }, { pending: await passwordStep() }));
    expect(reuse.status).toBe(401);
    expect(admin.twoFactorBackupCodes).toHaveLength(8);
  });
});
