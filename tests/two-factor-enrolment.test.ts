import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { authenticator } from 'otplib';

/**
 * Step 3 - 2FA enrolment routes (status / start / confirm / regenerate).
 *
 * Same harness pattern as tests/auth-admin-bypass.test.ts: Prisma is an
 * in-memory user, authenticate() returns a signed-in admin, and the shared
 * limiter is stubbed. Everything security-relevant is REAL: the AES-256-GCM
 * helper (with a generated key), otplib codes computed from the stored
 * secret, and bcrypt for the backup codes.
 */

process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');

const PASSWORD = 'Admin-pass-123';

type Admin = {
  id: string;
  email: string;
  password: string;
  role: 'ADMIN';
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorBackupCodes: string[];
  twoFactorLastUsedStep: number | null;
};

let admin: Admin;
let signedIn = true;

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === admin.id ? { ...admin } : null)),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Admin> }) => {
        if (where.id !== admin.id) throw new Error('not found');
        admin = { ...admin, ...data };
        return { ...admin };
      }),
    },
  },
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticate: vi.fn(async () =>
    signedIn ? { user: { id: admin.id, email: admin.email, role: 'ADMIN' }, error: null } : { user: null, error: 'No token' }
  ),
}));

class FakeUnavailable extends Error {}
vi.mock('@/lib/mongo-rate-limit', () => ({
  MongoRateLimitUnavailableError: FakeUnavailable,
  consumeRateLimit: vi.fn(async () => ({ ok: true })),
}));

const bcrypt = (await import('bcryptjs')).default;
const { decryptSecret } = await import('@/lib/two-factor-crypto');
const { verifyBackupCode, generateBackupCodes, buildOtpauthUrl } = await import('@/lib/two-factor');
const { GET: status } = await import('../app/api/admin/security/2fa/status/route');
const { POST: start } = await import('../app/api/admin/security/2fa/start/route');
const { POST: confirm } = await import('../app/api/admin/security/2fa/confirm/route');
const { POST: regenerate } = await import('../app/api/admin/security/2fa/backup-codes/regenerate/route');
const { NextRequest } = await import('next/server');

const STEP_MS = 30_000;
const stepNow = () => Math.floor(Date.now() / STEP_MS);

function req(path: string, body?: unknown) {
  return new NextRequest(`https://tapvyo.in${path}`, {
    method: body === undefined && path.endsWith('/status') ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The current code for the secret stored on the admin (decrypted, as an app would show it). */
function currentCode(): string {
  return authenticator.generate(decryptSecret(admin.twoFactorSecret!));
}

async function enrol(): Promise<string[]> {
  await start(req('/api/admin/security/2fa/start', {}));
  const res = await confirm(req('/api/admin/security/2fa/confirm', { code: currentCode() }));
  return (await res.json()).backupCodes;
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Pin the clock 10 s into a 30 s step, so a test can never straddle a step
  // boundary between generating a code and checking which step it matched.
  // otplib reads Date.now() too, so codes and checks agree.
  const fixed = Math.floor(Date.now() / STEP_MS) * STEP_MS + 10_000;
  vi.spyOn(Date, 'now').mockReturnValue(fixed);
  signedIn = true;
  admin = {
    id: 'admin1',
    email: 'admin@tapvyo.in',
    password: bcrypt.hashSync(PASSWORD, 4),
    role: 'ADMIN',
    isActive: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: [],
    twoFactorLastUsedStep: null,
  };
});

describe('helpers', () => {
  it('builds an encoded otpauth link', () => {
    expect(buildOtpauthUrl('Tapvyo', 'a+b@tapvyo.in', 'ABC')).toBe(
      'otpauth://totp/Tapvyo:a%2Bb%40tapvyo.in?secret=ABC&issuer=Tapvyo'
    );
  });

  it('generates 10 unambiguous 8-character backup codes', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    for (const code of codes) expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(new Set(codes).size).toBe(10);
  });
});

describe('GET /2fa/status', () => {
  it('returns only { enabled: false } for a fresh admin', async () => {
    const res = await status(req('/api/admin/security/2fa/status'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ enabled: false });
  });

  it('requires an admin session', async () => {
    signedIn = false;
    expect((await status(req('/api/admin/security/2fa/status'))).status).toBe(403);
  });
});

describe('POST /2fa/start', () => {
  it('returns the link + key, stores only ciphertext, and leaves 2FA off', async () => {
    const res = await start(req('/api/admin/security/2fa/start', {}));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['otpauthUrl', 'secretPreview']);
    expect(body.secretPreview).toMatch(/^[A-Z2-7]{32}$/); // 20 bytes, base32
    expect(body.otpauthUrl).toContain(`secret=${body.secretPreview}`);
    expect(body.otpauthUrl).toContain('issuer=Tapvyo');

    expect(admin.twoFactorSecret).not.toBe(body.secretPreview);
    expect(admin.twoFactorSecret).not.toContain(body.secretPreview);
    expect(decryptSecret(admin.twoFactorSecret!)).toBe(body.secretPreview);
    expect(admin.twoFactorEnabled).toBe(false);
  });

  it('rotates the secret when started again before confirming', async () => {
    const first = await (await start(req('/api/admin/security/2fa/start', {}))).json();
    const second = await (await start(req('/api/admin/security/2fa/start', {}))).json();
    expect(second.secretPreview).not.toBe(first.secretPreview);
    expect(decryptSecret(admin.twoFactorSecret!)).toBe(second.secretPreview);
  });

  it('refuses with 409 and ONLY { enabled, message } once 2FA is on', async () => {
    await enrol();
    const before = admin.twoFactorSecret;

    const res = await start(req('/api/admin/security/2fa/start', {}));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ enabled: true, message: '2FA is already enabled. Disable it first.' });
    expect(admin.twoFactorSecret).toBe(before);
    expect(admin.twoFactorEnabled).toBe(true);
  });

  it('returns 503 when the encryption key is missing, storing nothing', async () => {
    const key = process.env.TWO_FACTOR_ENCRYPTION_KEY;
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
    try {
      const res = await start(req('/api/admin/security/2fa/start', {}));
      expect(res.status).toBe(503);
      expect(admin.twoFactorSecret).toBeNull();
    } finally {
      process.env.TWO_FACTOR_ENCRYPTION_KEY = key;
    }
  });
});

describe('POST /2fa/confirm', () => {
  it('rejects a wrong code with 400 and leaves 2FA off', async () => {
    await start(req('/api/admin/security/2fa/start', {}));
    const good = currentCode();
    const wrong = good === '000000' ? '111111' : '000000';

    const res = await confirm(req('/api/admin/security/2fa/confirm', { code: wrong }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, message: 'Invalid code' });
    expect(admin.twoFactorEnabled).toBe(false);
    expect(admin.twoFactorBackupCodes).toEqual([]);
  });

  it('enables 2FA on a correct code, returns 10 codes once, stores hashes and the step', async () => {
    await start(req('/api/admin/security/2fa/start', {}));
    const code = currentCode();
    const expectedStep = stepNow();

    const res = await confirm(req('/api/admin/security/2fa/confirm', { code }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.backupCodes).toHaveLength(10);
    expect(admin.twoFactorEnabled).toBe(true);
    expect(admin.twoFactorBackupCodes).toHaveLength(10);
    for (const hash of admin.twoFactorBackupCodes) expect(hash).toMatch(/^\$2[aby]\$10\$/);
    // The plaintext is not what is stored.
    expect(admin.twoFactorBackupCodes).not.toContain(body.backupCodes[0]);
    expect((await verifyBackupCode(body.backupCodes[0], admin.twoFactorBackupCodes)).ok).toBe(true);

    expect(typeof admin.twoFactorLastUsedStep).toBe('number');
    expect(admin.twoFactorLastUsedStep).toBe(expectedStep);
  });

  it('refuses a second confirm with 409', async () => {
    await enrol();
    const res = await confirm(req('/api/admin/security/2fa/confirm', { code: currentCode() }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ enabled: true, message: '2FA is already enabled.' });
  });

  it('asks to start first when there is no secret', async () => {
    const res = await confirm(req('/api/admin/security/2fa/confirm', { code: '123456' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /2fa/backup-codes/regenerate', () => {
  it('rejects a wrong password with 401 and changes nothing', async () => {
    await enrol();
    const before = [...admin.twoFactorBackupCodes];
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + STEP_MS);

    const res = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: 'wrong',
      code: currentCode(),
    }));
    expect(res.status).toBe(401);
    expect(admin.twoFactorBackupCodes).toEqual(before);
  });

  it('REPLAY: rejects the very code that confirmed enrolment', async () => {
    await start(req('/api/admin/security/2fa/start', {}));
    const code = currentCode();
    await confirm(req('/api/admin/security/2fa/confirm', { code }));
    const before = [...admin.twoFactorBackupCodes];

    const res = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: PASSWORD,
      code,
    }));
    expect(res.status).toBe(401);
    expect(admin.twoFactorBackupCodes).toEqual(before);
  });

  it('with password + a NEWER code: 10 new codes, old ones dead, step advanced', async () => {
    const oldCodes = await enrol();
    const confirmedStep = admin.twoFactorLastUsedStep!;

    // One step (30 s) later, the authenticator shows a new code.
    const later = Date.now() + STEP_MS;
    vi.spyOn(Date, 'now').mockReturnValue(later);

    const res = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: PASSWORD,
      code: currentCode(),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.backupCodes).toHaveLength(10);
    expect(admin.twoFactorLastUsedStep).toBe(Math.floor(later / STEP_MS));
    expect(admin.twoFactorLastUsedStep).toBeGreaterThan(confirmedStep);

    expect((await verifyBackupCode(oldCodes[0], admin.twoFactorBackupCodes)).ok).toBe(false);
    expect((await verifyBackupCode(body.backupCodes[0], admin.twoFactorBackupCodes)).ok).toBe(true);
  });

  it('accepts a current backup code instead of an authenticator code', async () => {
    const oldCodes = await enrol();
    const stepBefore = admin.twoFactorLastUsedStep;

    const res = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: PASSWORD,
      code: oldCodes[3].toLowerCase(), // typed in lower case still works
    }));
    expect(res.status).toBe(200);
    // Backup-code path does not move the TOTP step.
    expect(admin.twoFactorLastUsedStep).toBe(stepBefore);
    // ...and that backup code is gone with the rest.
    expect((await verifyBackupCode(oldCodes[3], admin.twoFactorBackupCodes)).ok).toBe(false);
  });

  it('gives the same 401 body for a wrong password and a wrong code', async () => {
    await enrol();
    const wrongPassword = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: 'nope',
      code: 'ZZZZZZZZ',
    }));
    const wrongCode = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: PASSWORD,
      code: 'ZZZZZZZZ',
    }));
    expect(wrongPassword.status).toBe(401);
    expect(wrongCode.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await wrongCode.json());
  });

  it('refuses when 2FA is not enabled', async () => {
    const res = await regenerate(req('/api/admin/security/2fa/backup-codes/regenerate', {
      password: PASSWORD,
      code: '123456',
    }));
    expect(res.status).toBe(400);
  });
});
