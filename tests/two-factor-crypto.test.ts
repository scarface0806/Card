import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';

import {
  TwoFactorConfigError,
  TwoFactorDecryptError,
  decryptSecret,
  encryptSecret,
} from '@/lib/two-factor-crypto';

/**
 * src/lib/two-factor-crypto.ts - AES-256-GCM for stored TOTP secrets.
 * The key is read from the environment on every call, so each test sets
 * exactly the key it needs.
 */

const KEY_A = randomBytes(32).toString('base64');
const KEY_B = randomBytes(32).toString('base64');
// A realistic base32 TOTP secret.
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

const original = process.env.TWO_FACTOR_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.TWO_FACTOR_ENCRYPTION_KEY = KEY_A;
});

afterEach(() => {
  if (original === undefined) delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
  else process.env.TWO_FACTOR_ENCRYPTION_KEY = original;
});

/** Capture whatever a function throws. */
function thrown(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to throw');
}

describe('encryptSecret / decryptSecret', () => {
  it('round-trips to the original plaintext', () => {
    expect(decryptSecret(encryptSecret(SECRET))).toBe(SECRET);
    expect(decryptSecret(encryptSecret(''))).toBe('');
    expect(decryptSecret(encryptSecret('ünïcødé ✓'))).toBe('ünïcødé ✓');
  });

  it('stores iv || tag || ciphertext, base64', () => {
    const raw = Buffer.from(encryptSecret(SECRET), 'base64');
    expect(raw.length).toBe(12 + 16 + Buffer.byteLength(SECRET));
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const a = encryptSecret(SECRET);
    const b = encryptSecret(SECRET);
    expect(a).not.toBe(b);
    expect(Buffer.from(a, 'base64').subarray(0, 12)).not.toEqual(Buffer.from(b, 'base64').subarray(0, 12));
  });

  it('refuses to decrypt under a different key', () => {
    const enc = encryptSecret(SECRET);
    process.env.TWO_FACTOR_ENCRYPTION_KEY = KEY_B;
    expect(() => decryptSecret(enc)).toThrow(TwoFactorDecryptError);
  });

  it('detects tampering: one changed base64 character', () => {
    const enc = encryptSecret(SECRET);
    // A character well inside the ciphertext, never the trailing padding.
    const at = Math.floor(enc.length / 2);
    const swapped = enc[at] === 'A' ? 'B' : 'A';
    const tampered = enc.slice(0, at) + swapped + enc.slice(at + 1);

    expect(tampered).not.toBe(enc);
    expect(() => decryptSecret(tampered)).toThrow(TwoFactorDecryptError);
  });

  it('rejects malformed input', () => {
    expect(() => decryptSecret('not base64!!')).toThrow(TwoFactorDecryptError);
    expect(() => decryptSecret(Buffer.alloc(10).toString('base64'))).toThrow(TwoFactorDecryptError);
  });
});

describe('key configuration', () => {
  it('throws TwoFactorConfigError, not a generic Error, when the key is missing', () => {
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
    const error = thrown(() => encryptSecret(SECRET));
    expect(error).toBeInstanceOf(TwoFactorConfigError);
    expect(error.name).toBe('TwoFactorConfigError');
    expect(() => decryptSecret('AAAA')).toThrow(TwoFactorConfigError);
  });

  it('throws TwoFactorConfigError for a short key', () => {
    process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(16).toString('base64');
    expect(() => encryptSecret(SECRET)).toThrow(TwoFactorConfigError);
  });

  it('throws TwoFactorConfigError for a key that is not valid base64', () => {
    process.env.TWO_FACTOR_ENCRYPTION_KEY = 'this is not base64 at all!';
    expect(() => encryptSecret(SECRET)).toThrow(TwoFactorConfigError);
  });

  it('does not need the key at import time (the build must work without it)', async () => {
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
    await expect(import('@/lib/two-factor-crypto')).resolves.toBeDefined();
  });
});

describe('no secrets in error messages', () => {
  it('never includes the key, the plaintext or the ciphertext', () => {
    const enc = encryptSecret(SECRET);

    process.env.TWO_FACTOR_ENCRYPTION_KEY = KEY_B;
    const wrongKey = thrown(() => decryptSecret(enc));

    const shortKey = randomBytes(16).toString('base64');
    process.env.TWO_FACTOR_ENCRYPTION_KEY = shortKey;
    const configError = thrown(() => encryptSecret(SECRET));

    for (const error of [wrongKey, configError]) {
      const text = `${error.name} ${error.message} ${String(error.stack)}`;
      for (const secret of [KEY_A, KEY_B, shortKey, SECRET, enc]) {
        expect(text).not.toContain(secret);
      }
    }
  });
});
