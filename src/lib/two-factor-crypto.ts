/**
 * Encryption for stored TOTP secrets. SERVER-ONLY.
 *
 * A TOTP secret is as sensitive as a password that never expires: whoever
 * holds it can generate valid codes forever. It is therefore never written to
 * the database in plain text. User.twoFactorSecret holds the output of
 * encryptSecret(): AES-256-GCM, a fresh random 12-byte IV per encryption, and
 * the 16-byte auth tag that makes any modification detectable.
 *
 * Stored format: base64( iv[12] || authTag[16] || ciphertext )
 *
 * KEY
 * TWO_FACTOR_ENCRYPTION_KEY, base64 of exactly 32 random bytes
 * (scripts/gen-2fa-key.js prints one). Server-only - it must never become a
 * NEXT_PUBLIC_ variable. A database dump without this key yields no secrets.
 * Losing or changing the key makes every enrolled secret undecryptable, and
 * those admins must re-enrol (scripts/reset-admin-2fa.js, when it exists).
 *
 * FAIL CLOSED, like src/lib/mongo-rate-limit.ts
 * Nothing is read at import time, so `next build` works without the key. The
 * key is checked on first use and every problem throws a typed error:
 *  - TwoFactorConfigError  - key missing, not base64, or not 32 bytes.
 *  - TwoFactorDecryptError - wrong key, tampered or malformed ciphertext.
 * Callers must treat both as "2FA cannot be verified" - a refusal - and never
 * as a pass.
 *
 * NO SECRETS IN MESSAGES OR LOGS
 * Error messages name the problem only. They never include the key, any part
 * of it, the plaintext or the ciphertext, and this module logs nothing.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class TwoFactorConfigError extends Error {
  constructor(reason: string) {
    super(`two-factor encryption is not configured (${reason})`);
    this.name = 'TwoFactorConfigError';
  }
}

export class TwoFactorDecryptError extends Error {
  constructor(reason: string) {
    super(`two-factor secret could not be decrypted (${reason})`);
    this.name = 'TwoFactorDecryptError';
  }
}

/** Strict base64: re-encoding must give back the same text, so typos are caught. */
function decodeStrictBase64(value: string): Buffer | null {
  const buf = Buffer.from(value, 'base64');
  return buf.toString('base64') === value ? buf : null;
}

/**
 * Read on every call, not cached at import: the build needs no key, and a
 * rotated key in the environment takes effect without a cold start.
 */
function getKey(): Buffer {
  const raw = process.env.TWO_FACTOR_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new TwoFactorConfigError('TWO_FACTOR_ENCRYPTION_KEY is not set');
  }

  const key = decodeStrictBase64(raw);
  if (!key) {
    throw new TwoFactorConfigError('TWO_FACTOR_ENCRYPTION_KEY is not valid base64');
  }
  if (key.length !== KEY_BYTES) {
    throw new TwoFactorConfigError(`TWO_FACTOR_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes`);
  }
  return key;
}

/** Encrypt a TOTP secret for storage in User.twoFactorSecret. */
export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/**
 * Decrypt a value produced by encryptSecret().
 *
 * @throws TwoFactorConfigError  when the key is missing or malformed.
 * @throws TwoFactorDecryptError when the value was tampered with, was
 *         encrypted under a different key, or is not in the stored format.
 */
export function decryptSecret(enc: string): string {
  const key = getKey();

  const data = typeof enc === 'string' ? decodeStrictBase64(enc) : null;
  if (!data || data.length < IV_BYTES + TAG_BYTES) {
    throw new TwoFactorDecryptError('malformed value');
  }

  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = data.subarray(IV_BYTES + TAG_BYTES);

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    // GCM authentication failed. Deliberately no detail from the underlying
    // error: it adds nothing useful and must not echo any input.
    throw new TwoFactorDecryptError('authentication failed - wrong key or tampered value');
  }
}
