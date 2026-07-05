import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Magic-link token primitives. Pure and side-effect free so they can be unit
 * tested without a database.
 *
 * We generate a high-entropy raw token, hand the raw value to the user (in the
 * emailed link), and persist ONLY its SHA-256 hash. A stolen database therefore
 * never yields a usable link.
 */

const TOKEN_BYTES = 32; // 256 bits

/** A URL-safe raw token to embed in a magic link. Never stored. */
export function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Deterministic hash of a raw token — this is what we store and look up by. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Constant-time comparison of two token hashes. */
export function tokenHashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Expiry timestamp for a freshly issued token, given "now". */
export function magicLinkExpiry(now: Date): Date {
  return new Date(now.getTime() + MAGIC_LINK_TTL_MS);
}

/** A token is usable only if it has never been consumed and has not expired. */
export function isTokenUsable(
  token: { consumedAt: Date | null; expiresAt: Date },
  now: Date,
): boolean {
  if (token.consumedAt !== null) return false;
  return token.expiresAt.getTime() > now.getTime();
}
