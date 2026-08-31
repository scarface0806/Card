import crypto from "crypto";
import { getJwtSecretOrThrow } from "@/lib/env";

/**
 * All blog hashing is peppered with JWT_SECRET, the secret this deployment
 * already has. No new environment variable is introduced, and nothing here is
 * reversible: a leaked `post_views` collection yields no IP addresses.
 */
function hmac(value: string, scope: string): string {
  return crypto
    .createHmac("sha256", getJwtSecretOrThrow())
    .update(`${scope}:${value}`)
    .digest("hex");
}

/** Peppered digest of a visitor IP. Stored instead of the address itself. */
export function hashIp(ip: string): string {
  return hmac(ip || "unknown", "blog-ip");
}

/**
 * Peppered digest identifying one browsing session for a post. The session id
 * comes from the client, so this is a de-duplication key, not an identity —
 * it is combined with the post id by a unique index rather than trusted.
 */
export function hashSession(sessionId: string): string {
  return hmac(sessionId, "blog-session");
}

/**
 * Token for the "Preview as draft" link. Derived from the post id, so it needs
 * no storage and is revoked for every post the moment JWT_SECRET rotates.
 */
export function previewToken(postId: string): string {
  return hmac(postId, "blog-preview").slice(0, 32);
}

export function verifyPreviewToken(postId: string, token: string | null | undefined): boolean {
  if (!token) return false;

  const expected = Buffer.from(previewToken(postId));
  const given = Buffer.from(token);

  // Length must match before timingSafeEqual, which throws on a mismatch.
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
