import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

/**
 * Step 5 - POST /api/admin/security/2fa/disable and scripts/reset-admin-2fa.js.
 *
 * Route: REAL handler, shared limiter (over an in-memory rate_limits fake, as
 * in two-factor-login.test.ts), AES-GCM helper, otplib and bcrypt.
 * authenticate() is stubbed to a signed-in admin (as in the enrolment tests);
 * Prisma is an in-memory user whose updateMany enforces the route's
 * compare-and-set (id + twoFactorEnabled + password hash).
 *
 * Script: main() run in-process with injected Prisma, rate_limits and output.
 */

process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

const PASSWORD = 'Admin-pass-123';
const STEP_MS = 30_000;

type Admin = {
  id: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'CUSTOMER';
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorBackupCodes: string[];
  twoFactorLastUsedStep: number | null;
};

let admin: Admin;
let signedIn = true;
/** Runs inside updateMany before the check - simulates a concurrent write. */
let beforeWrite: (() => void) | null = null;

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
  deleteMany: vi.fn(async () => ({ deletedCount: 0 })),
};
vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => ({ collection: () => collection })),
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticate: vi.fn(async () =>
    signedIn ? { user: { id: admin.id, email: admin.email, role: 'ADMIN' }, error: null } : { user: null, error: 'No token' }
  ),
}));

const updateMany = vi.fn(async ({ where, data }: {
  where: { id: string; twoFactorEnabled?: boolean; password?: string };
  data: Partial<Omit<Admin, 'twoFactorBackupCodes'>> & { twoFactorBackupCodes?: { set: string[] } };
}) => {
  beforeWrite?.();
  if (where.id !== admin.id) return { count: 0 };
  if (where.twoFactorEnabled !== undefined && admin.twoFactorEnabled !== where.twoFactorEnabled) return { count: 0 };
  if (where.password !== undefined && admin.password !== where.password) return { count: 0 };
  const { twoFactorBackupCodes, ...rest } = data;
  admin = { ...admin, ...rest, ...(twoFactorBackupCodes ? { twoFactorBackupCodes: [...twoFactorBackupCodes.set] } : {}) };
  return { count: 1 };
});

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === admin.id ? structuredClone(admin) : null)),
      updateMany: (args: Parameters<typeof updateMany>[0]) => updateMany(args),
    },
  },
}));

const { encryptSecret } = await import('@/lib/two-factor-crypto');
const { generateBackupCodes, hashBackupCodes } = await import('@/lib/two-factor');
const { POST: disable } = await import('../app/api/admin/security/2fa/disable/route');
const { NextRequest } = await import('next/server');

// The operator script is plain CommonJS.
type ScriptMain = (options: Record<string, unknown>) => Promise<number>;
const { main: resetMain } = createRequire(import.meta.url)('../scripts/reset-admin-2fa.js') as { main: ScriptMain };

const SECRET = authenticator.generateSecret(20);
const currentCode = () => authenticator.generate(SECRET);
let backupCodes: string[];

function req(body: unknown) {
  return new NextRequest('https://tapvyo.in/api/admin/security/2fa/disable', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const CLEARED = {
  twoFactorEnabled: false,
  twoFactorSecret: null,
  twoFactorBackupCodes: [],
  twoFactorLastUsedStep: null,
};

beforeEach(async () => {
  vi.restoreAllMocks();
  // Pin the clock 10 s into a 30 s step (otplib reads Date.now() too).
  const fixed = Math.floor(Date.now() / STEP_MS) * STEP_MS + 10_000;
  vi.spyOn(Date, 'now').mockReturnValue(fixed);
  store.clear();
  updateMany.mockClear();
  beforeWrite = null;
  signedIn = true;
  backupCodes = generateBackupCodes();
  admin = {
    id: 'admin1',
    email: 'admin@tapvyo.in',
    password: bcrypt.hashSync(PASSWORD, 4),
    role: 'ADMIN',
    twoFactorEnabled: true,
    twoFactorSecret: encryptSecret(SECRET),
    twoFactorBackupCodes: await hashBackupCodes(backupCodes),
    twoFactorLastUsedStep: null,
  };
});

describe('POST /api/admin/security/2fa/disable', () => {
  it('rejects a request with no session', async () => {
    signedIn = false;
    const res = await disable(req({ password: PASSWORD, code: currentCode() }));
    expect([401, 403]).toContain(res.status);
    expect(admin.twoFactorEnabled).toBe(true);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('wrong password: 401 "Invalid password", nothing changes', async () => {
    const before = structuredClone(admin);
    const res = await disable(req({ password: 'wrong', code: currentCode() }));
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe('Invalid password');
    expect(admin).toEqual(before);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('wrong code: 401 "Invalid code", nothing changes', async () => {
    const before = structuredClone(admin);
    const wrong = currentCode() === '000000' ? '111111' : '000000';
    const res = await disable(req({ password: PASSWORD, code: wrong }));
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe('Invalid code');
    expect(admin).toEqual(before);
  });

  it('password + TOTP clears all four 2FA fields', async () => {
    const res = await disable(req({ password: PASSWORD, code: currentCode() }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: '2FA disabled' });
    expect(admin).toMatchObject(CLEARED);
    expect(admin.password).toBeTruthy();
  });

  it('a TOTP already used (step <= lastUsedStep) is refused', async () => {
    admin.twoFactorLastUsedStep = Math.floor(Date.now() / STEP_MS);
    const res = await disable(req({ password: PASSWORD, code: currentCode() }));
    expect(res.status).toBe(401);
    expect(admin.twoFactorEnabled).toBe(true);
  });

  it('password + backup code clears all four 2FA fields', async () => {
    const res = await disable(req({ password: PASSWORD, code: backupCodes[3].toLowerCase() }));
    expect(res.status).toBe(200);
    expect(admin).toMatchObject(CLEARED);
  });

  it('already disabled: 200, idempotent, no write', async () => {
    admin = { ...admin, ...CLEARED };
    const res = await disable(req({ password: PASSWORD, code: '123456' }));
    expect(res.status).toBe(200);
    expect((await res.json()).message).toBe('2FA is already disabled');
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('6th attempt in 15 minutes is 429 even with valid credentials; DB unchanged', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await disable(req({ password: 'wrong', code: currentCode() }));
      expect(res.status).toBe(401);
    }
    const before = structuredClone(admin);
    const res = await disable(req({ password: PASSWORD, code: currentCode() }));
    expect(res.status).toBe(429);
    expect((await res.json()).message).toBe('Too many attempts. Please try again later.');
    expect(admin).toEqual(before);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('password changed between check and write: 409 "Please retry", 2FA stays on', async () => {
    beforeWrite = () => {
      admin.password = bcrypt.hashSync('Changed-pass-456', 4);
    };
    const res = await disable(req({ password: PASSWORD, code: currentCode() }));
    expect(res.status).toBe(409);
    expect((await res.json()).message).toBe('Please retry');
    expect(admin.twoFactorEnabled).toBe(true);
    expect(admin.twoFactorSecret).not.toBeNull();
  });

  it('bad body is 400', async () => {
    const res = await disable(req({ password: PASSWORD }));
    expect(res.status).toBe(400);
  });

  it('every reply clears a leftover pending-login cookie', async () => {
    const res = await disable(req({ password: 'wrong', code: '000000' }));
    expect(res.headers.getSetCookie().some((c) => c.startsWith('admin-2fa-pending=;') || c.startsWith('admin-2fa-pending=') && /max-age=0/i.test(c))).toBe(true);
  });
});

// ---- scripts/reset-admin-2fa.js -------------------------------------------------
describe('scripts/reset-admin-2fa.js main()', () => {
  type Row = { _id: string };

  function harness(overrides: { env?: Record<string, string>; users?: Admin[]; rows?: Row[] } = {}) {
    const users = overrides.users ?? [admin];
    let rows = [...(overrides.rows ?? [])];
    const out: string[] = [];
    const err: string[] = [];
    const prisma = {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email: string } }) => {
          const u = users.find((x) => x.email === where.email);
          return u ? { id: u.id, email: u.email, role: u.role, twoFactorEnabled: u.twoFactorEnabled } : null;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const u = users.find((x) => x.id === where.id)!;
          const { twoFactorBackupCodes, ...rest } = data as { twoFactorBackupCodes: { set: string[] } };
          Object.assign(u, rest, { twoFactorBackupCodes: [...twoFactorBackupCodes.set] });
          return u;
        }),
      },
      $disconnect: vi.fn(async () => {}),
    };
    const rateLimits = {
      collection: {
        deleteMany: vi.fn(async (filter: { _id: { $regex: RegExp } }) => {
          const before = rows.length;
          rows = rows.filter((r) => !filter._id.$regex.test(r._id));
          return { deletedCount: before - rows.length };
        }),
      },
      close: vi.fn(async () => {}),
    };
    const run = (argv: string[]) =>
      resetMain({
        argv,
        env: { DATABASE_URL: 'mongodb://localhost:27017/test', USERNAME: 'operator1', ...overrides.env },
        out: (line: string) => out.push(line),
        err: (line: string) => err.push(line),
        prompt: async () => 'no',
        openRateLimits: async () => rateLimits,
        prisma,
      });
    return { run, out, err, prisma, rateLimits, remaining: () => rows, users };
  }

  it('unknown email: exit 1 "not found", nothing written', async () => {
    const h = harness();
    expect(await h.run(['nobody@tapvyo.in', '--yes'])).toBe(1);
    expect(h.err.join('\n')).toContain('not found');
    expect(h.prisma.user.update).not.toHaveBeenCalled();
  });

  it('non-admin: exit 1 "not an admin", nothing written', async () => {
    const customer: Admin = { ...admin, id: 'cust1', email: 'cust@tapvyo.in', role: 'CUSTOMER' };
    const h = harness({ users: [customer] });
    expect(await h.run(['cust@tapvyo.in', '--yes'])).toBe(1);
    expect(h.err.join('\n')).toContain('not an admin');
    expect(h.prisma.user.update).not.toHaveBeenCalled();
    expect(customer.twoFactorEnabled).toBe(true);
  });

  it('--yes on a valid admin clears the fields, prints the audit line, exit 0', async () => {
    const h = harness();
    expect(await h.run(['Admin@Tapvyo.in', '--yes'])).toBe(0);
    expect(admin).toMatchObject(CLEARED);
    const printed = h.out.join('\n');
    expect(printed).toMatch(/\[2fa-reset\] \S+ email=admin@tapvyo\.in operator=operator1 cleared=twoFactorEnabled,twoFactorSecret,twoFactorBackupCodes,twoFactorLastUsedStep/);
    // Never the secret or any hash.
    expect(printed).not.toContain('$2');
    expect(h.err).toEqual([]);
  });

  it('without --yes, anything but "YES" aborts with nothing changed', async () => {
    const h = harness();
    expect(await h.run(['admin@tapvyo.in'])).toBe(1);
    expect(h.err.join('\n')).toContain('Aborted');
    expect(admin.twoFactorEnabled).toBe(true);
  });

  it('production: --yes without --force is refused (exit 1); with --force it succeeds', async () => {
    const refused = harness({ env: { NODE_ENV: 'production' } });
    expect(await refused.run(['admin@tapvyo.in', '--yes'])).toBe(1);
    expect(refused.err.join('\n')).toContain('--force');
    expect(refused.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(admin.twoFactorEnabled).toBe(true);

    const forced = harness({ env: { NODE_ENV: 'production' } });
    expect(await forced.run(['admin@tapvyo.in', '--yes', '--force'])).toBe(0);
    expect(admin).toMatchObject(CLEARED);
  });

  it("removes this admin's 2FA rate-limit docs only, and reports the count", async () => {
    const rows: Row[] = [
      { _id: 'admin-login-2fa-user:1m:admin1:100' },
      { _id: 'admin-2fa-disable:15m:admin1:7' },
      { _id: 'admin-2fa-disable:15m:admin10:7' }, // another admin, id prefix match
      { _id: 'admin-login-2fa-user:1m:other:100' }, // another admin
      { _id: 'admin-login-2fa-ip:1m:203.0.113.5:100' }, // per-IP, left alone
      { _id: 'admin-login:15m:admin1:3' }, // password-step limiter, not 2FA
    ];
    const h = harness({ rows });
    expect(await h.run(['admin@tapvyo.in', '--yes'])).toBe(0);
    expect(h.remaining().map((r) => r._id)).toEqual([
      'admin-2fa-disable:15m:admin10:7',
      'admin-login-2fa-user:1m:other:100',
      'admin-login-2fa-ip:1m:203.0.113.5:100',
      'admin-login:15m:admin1:3',
    ]);
    expect(h.out.join('\n')).toContain('rate_limits documents removed: 2');
    expect(h.rateLimits.close).toHaveBeenCalled();
  });

  it('bad usage: exit 1 with the usage line', async () => {
    const h = harness();
    expect(await h.run(['admin@tapvyo.in', '--yse'])).toBe(1);
    expect(h.err.join('\n')).toContain('Usage:');
  });
});
