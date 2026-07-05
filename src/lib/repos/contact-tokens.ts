import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, contacts } from "@/db/schema";
import { generateRawToken, hashToken, magicLinkExpiry, isTokenUsable } from "@/lib/tokens";
import type { ContactSession } from "@/lib/contact-session";

/**
 * Contact magic links: single-use, 15-minute tokens. We store only the SHA-256
 * hash; the raw token lives only in the emailed URL.
 */

export async function issueContactToken(contactId: string, now: Date): Promise<string> {
  const raw = generateRawToken();
  await db.insert(authTokens).values({
    contactId,
    tokenHash: hashToken(raw),
    expiresAt: magicLinkExpiry(now),
  });
  return raw;
}

/**
 * Consume a raw magic-link token: validate it's unused + unexpired, mark it
 * consumed, and return the contact's tenant scope for the session cookie.
 * Returns null on any failure (unknown/expired/used).
 */
export async function consumeContactToken(raw: string, now: Date): Promise<ContactSession | null> {
  const tokenHash = hashToken(raw);
  const token = await db.query.authTokens.findFirst({ where: eq(authTokens.tokenHash, tokenHash) });
  if (!token || !isTokenUsable(token, now)) return null;

  await db.update(authTokens).set({ consumedAt: now }).where(eq(authTokens.id, token.id));

  const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, token.contactId) });
  if (!contact) return null;

  await db.update(contacts).set({ lastLoginAt: now }).where(eq(contacts.id, contact.id));

  return {
    contactId: contact.id,
    customerId: contact.customerId,
    organisationId: contact.organisationId,
  };
}
