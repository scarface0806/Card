/**
 * PASSWORD RESET TOKENS
 *
 * SERVER-ONLY. Imported by app/api/auth/forgot-password and
 * app/api/auth/reset-password. Never import this from a client component - it
 * reads JWT_SECRET.
 *
 * THE RULES THIS FILE EXISTS TO ENFORCE:
 *
 *  - The raw token is returned to the caller exactly once, so it can be put in
 *    an email, and is never persisted. Only its SHA-256 digest is stored, so a
 *    dump of `password_reset_tokens` cannot be replayed against any account.
 *    Same reasoning as PostView.ipHash.
 *  - The digest is peppered with JWT_SECRET. A stolen database alone is not
 *    enough to precompute digests for guessed tokens.
 *  - Tokens are single-use (`usedAt`) and short-lived (TTL below). A successful
 *    reset invalidates every other outstanding token for that user, so a link
 *    sent to a compromised inbox stops working the moment the real owner
 *    resets.
 *  - Comparison is constant-time. A byte-by-byte early return on the digest
 *    leaks how much of a guess was correct.
 *  - Nothing here distinguishes "no such token" from "expired" from "already
 *    used". All three are one `null`, so the endpoint cannot be used as an
 *    oracle - the same discipline as src/lib/track-order.ts.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { ObjectId } from "mongodb";

import prisma from "@/lib/prisma";
import { getMongoDb } from "@/lib/mongodb";
import { getJwtSecretOrThrow } from "@/lib/env";
// Shared predicate. Reads need no transaction and stay on Prisma throughout;
// only the writes below carry a raw-driver fallback. See src/lib/replica-set.ts.
import { isReplicaSetRequiredError } from "@/lib/replica-set";

/**
 * How long a reset link stays valid.
 *
 * 30 minutes: long enough to survive a slow inbox, short enough that a link
 * sitting in a mail archive is not a standing key to the account.
 */
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/** Raw token length in bytes; 32 bytes = 256 bits of entropy. */
const TOKEN_BYTES = 32;

/**
 * SHA-256 of the token, peppered with JWT_SECRET.
 *
 * Exported so the reset endpoint can hash an incoming token and look it up by
 * digest. There is no way back from the digest to the token.
 */
export function hashResetToken(token: string): string {
  const pepper = getJwtSecretOrThrow();
  return createHash("sha256").update(`${token}${pepper}`).digest("hex");
}

/** Coarse, non-reversible request fingerprint. No raw IP is stored. */
export function hashRequestOrigin(ip: string | null): string | null {
  if (!ip) return null;
  const pepper = getJwtSecretOrThrow();
  return createHash("sha256").update(`${ip}${pepper}`).digest("hex").slice(0, 32);
}

/**
 * Mint a reset token for a user and store only its digest.
 *
 * Returns the RAW token. The caller must put it straight into the email and
 * then forget it - it must never be logged, and must never appear in an HTTP
 * response body.
 */
export async function createResetToken(
  userId: string,
  requestIp: string | null = null
): Promise<{ token: string; expiresAt: Date }> {
  // Hex, not base64: it survives a URL, an email client's line wrapping and a
  // copy-paste without any encoding step.
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  const data = {
    userId,
    tokenHash: hashResetToken(token),
    expiresAt,
    requestedFromHash: hashRequestOrigin(requestIp),
  };

  try {
    await prisma.passwordResetToken.create({ data });
  } catch (error) {
    if (!isReplicaSetRequiredError(error)) throw error;

    // Single-node MongoDB. Insert with the raw driver, writing the same shape
    // Prisma would - note userId must be a real ObjectId, because the schema
    // declares it @db.ObjectId and a string would not match on read.
    const db = await getMongoDb();
    await db.collection("password_reset_tokens").insertOne({
      ...data,
      userId: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  return { token, expiresAt };
}

/**
 * Constant-time string comparison.
 *
 * timingSafeEqual throws when the two buffers differ in length, so the lengths
 * are checked first - and because both inputs here are fixed-length hex
 * digests, that check leaks nothing.
 */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Resolve a raw token to the user it belongs to, or null.
 *
 * Returns null for a token that does not exist, has expired, or has already
 * been used. The caller must render one identical message for all three.
 */
export async function findValidResetToken(
  token: string
): Promise<{ id: string; userId: string } | null> {
  if (!token || typeof token !== "string") return null;

  // Basic shape check before touching the database: a 64-char hex string. This
  // is not a security boundary, it just avoids a query per malformed request.
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;

  const tokenHash = hashResetToken(token);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, tokenHash: true, expiresAt: true, usedAt: true },
  });

  if (!row) return null;
  // The unique lookup above already matched the digest; this re-compares it in
  // constant time so the code path does not depend on how the index resolved.
  if (!safeEqualHex(row.tokenHash, tokenHash)) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;

  return { id: row.id, userId: row.userId };
}

/**
 * Write the new password hash onto the user.
 *
 * Lives here rather than in the route so the P2031 fallback described at the
 * top of this file is in one place. `User` has relations (orders, cards), so
 * Prisma wraps even a single-field update in a transaction - which a
 * single-node MongoDB refuses.
 *
 * The plaintext password never reaches this function; it takes the hash.
 */
export async function setUserPasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
    return;
  } catch (error) {
    if (!isReplicaSetRequiredError(error)) throw error;
  }

  const db = await getMongoDb();
  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password: passwordHash, updatedAt: new Date() } }
  );

  // A reset that matched no row must not report success - the caller would
  // tell the customer their password had changed when it had not.
  if (result.matchedCount === 0) {
    throw new Error(`Password update matched no user for id ${userId}`);
  }
}

/**
 * Mark a token used and invalidate every other outstanding token for the same
 * user, so one reset closes every link that was in flight.
 */
export async function consumeResetToken(
  tokenId: string,
  userId: string
): Promise<void> {
  const now = new Date();

  try {
    await prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: now },
    });

    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });
    return;
  } catch (error) {
    if (!isReplicaSetRequiredError(error)) throw error;
  }

  // Single-node MongoDB fallback. Both writes go through the raw driver, and
  // the second one covers the first, so a partial failure still cannot leave
  // THIS token usable.
  const db = await getMongoDb();
  const tokens = db.collection("password_reset_tokens");

  await tokens.updateOne(
    { _id: new ObjectId(tokenId) },
    { $set: { usedAt: now } }
  );

  await tokens.updateMany(
    {
      userId: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
      usedAt: null,
    },
    { $set: { usedAt: now } }
  );
}
