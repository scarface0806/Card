/**
 * Shared helpers for admin two-factor authentication (TOTP). SERVER-ONLY.
 *
 * Route files may only export route handlers, so everything the 2FA routes
 * share lives here: building the authenticator link, checking a 6-digit
 * code, generating/hashing backup codes, and the rate-limit call.
 *
 * NOTHING HERE LOGS. Secrets, codes and backup codes never reach a log line
 * or an error message.
 *
 * Step 4 (two-step login) is meant to reuse verifyTotp and verifyBackupCode,
 * so replay protection and backup-code checks exist in exactly one place.
 */

import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

import { consumeRateLimit, type RateLimitDecision, type RateWindow } from '@/lib/mongo-rate-limit';

/** RFC 6238 default, and what every authenticator app uses. */
const STEP_SECONDS = 30;

/**
 * A per-module copy with a ±1 step window (one 30 s step either side, for
 * clock drift and typing time). clone() rather than setting
 * authenticator.options, so nothing else importing otplib inherits this.
 */
const totp = authenticator.clone({ window: 1 });

/** Backup-code alphabet: A-Z and 2-9 without 0/O/1/I, so codes read unambiguously. */
const BACKUP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BACKUP_LENGTH = 8;
const BACKUP_BCRYPT_COST = 10;

/** A new 20-byte TOTP secret, base32 (32 characters). */
export function generateTotpSecret(): string {
  // otplib's default is 10 bytes; 20 bytes (160 bits) is the RFC 4226 recommendation.
  return totp.generateSecret(20);
}

/**
 * The otpauth:// link an authenticator app reads from the QR code.
 *   otpauth://totp/<Issuer>:<account>?secret=<secret>&issuer=<Issuer>
 */
export function buildOtpauthUrl(issuer: string, accountName: string, secret: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * Check a 6-digit code against a secret.
 *
 * Returns the time-step the code ACTUALLY matched (current step + otplib's
 * delta of -1, 0 or +1), so the caller can store it as
 * twoFactorLastUsedStep and refuse that code - or any earlier one - next
 * time. With `lastUsedStep`, a code whose step is not strictly after it is
 * rejected: that is the replay guarantee.
 */
export function verifyTotp(
  secret: string,
  token: string,
  lastUsedStep?: number | null
): { ok: boolean; step: number | null } {
  if (!/^\d{6}$/.test(token)) return { ok: false, step: null };

  let delta: number | null;
  try {
    delta = totp.checkDelta(token, secret);
  } catch {
    return { ok: false, step: null };
  }
  if (delta === null) return { ok: false, step: null };

  const step = Math.floor(Date.now() / 1000 / STEP_SECONDS) + delta;
  if (typeof lastUsedStep === 'number' && step <= lastUsedStep) {
    return { ok: false, step: null };
  }
  return { ok: true, step };
}

/** `count` new backup codes, each 8 characters from BACKUP_ALPHABET. */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    // Rejection sampling: only bytes below a multiple of the alphabet size
    // are used, so every character is equally likely (no modulo bias).
    const max = 256 - (256 % BACKUP_ALPHABET.length);
    while (code.length < BACKUP_LENGTH) {
      for (const byte of randomBytes(BACKUP_LENGTH * 2)) {
        if (byte < max && code.length < BACKUP_LENGTH) {
          code += BACKUP_ALPHABET[byte % BACKUP_ALPHABET.length];
        }
      }
    }
    codes.push(code);
  }
  return codes;
}

/** Normalise what a person typed: upper case, spaces and dashes removed. */
function normaliseBackupCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, '');
}

/** bcrypt hashes for storage in User.twoFactorBackupCodes (cost 10). */
export function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(normaliseBackupCode(code), BACKUP_BCRYPT_COST)));
}

/**
 * Find which stored hash, if any, a typed backup code matches. `index` is
 * the position to remove when the code is spent (Step 4); -1 when no match.
 */
export async function verifyBackupCode(
  plain: string,
  hashes: readonly string[]
): Promise<{ ok: boolean; index: number }> {
  const candidate = normaliseBackupCode(plain);
  if (candidate.length !== BACKUP_LENGTH) return { ok: false, index: -1 };

  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(candidate, hashes[i])) return { ok: true, index: i };
  }
  return { ok: false, index: -1 };
}

/**
 * The shared (MongoDB) rate limiter, so every 2FA route calls it the same
 * way. Throws MongoRateLimitUnavailableError when it cannot run - routes
 * turn that into a 503, never a pass.
 */
export function consumeLimiter(
  scope: string,
  key: string,
  windows: readonly RateWindow[]
): Promise<RateLimitDecision> {
  return consumeRateLimit(scope, key, windows);
}
