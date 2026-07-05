import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Contact (client) sessions. Contacts do NOT use gate — after they open a
 * single-use magic link we mint a signed, longer-lived session cookie so they
 * can return without a new link. The cookie is stateless: an HMAC-signed
 * payload carrying the tenant scope (contact + customer + org).
 */

export const CONTACT_COOKIE = "handoff_contact";
export const CONTACT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type ContactSession = {
  contactId: string;
  customerId: string;
  organisationId: string;
};

function secret(): string {
  const s = process.env.HANDOFF_SESSION_SECRET;
  if (!s) throw new Error("HANDOFF_SESSION_SECRET is not set");
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Sign a contact session into a cookie value valid until `now + TTL`. */
export function signContactSession(session: ContactSession, now: Date): string {
  const payload = { ...session, exp: now.getTime() + CONTACT_SESSION_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

/** Verify + decode a cookie value. Returns null if tampered or expired. */
export function verifyContactSession(value: string | undefined, now: Date): ContactSession | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;

  const expected = b64url(createHmac("sha256", secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as ContactSession & { exp: number };
    if (typeof payload.exp !== "number" || payload.exp < now.getTime()) return null;
    return { contactId: payload.contactId, customerId: payload.customerId, organisationId: payload.organisationId };
  } catch {
    return null;
  }
}
