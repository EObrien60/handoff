import { describe, it, expect } from "vitest";
import {
  assertCanAccess,
  assertIsOwner,
  assertIsMember,
  TenantAccessError,
  type MemberPrincipal,
  type ContactPrincipal,
} from "./principal";
import {
  generateRawToken,
  hashToken,
  tokenHashesEqual,
  magicLinkExpiry,
  isTokenUsable,
  MAGIC_LINK_TTL_MS,
} from "./tokens";

const owner: MemberPrincipal = { kind: "member", memberId: "m1", organisationId: "orgA", role: "owner" };
const staff: MemberPrincipal = { kind: "member", memberId: "m2", organisationId: "orgA", role: "member" };
const contact: ContactPrincipal = { kind: "contact", contactId: "c1", organisationId: "orgA", customerId: "custA" };

describe("tenant isolation (NFR #1)", () => {
  it("lets a member access resources in their own org", () => {
    expect(() => assertCanAccess(staff, { organisationId: "orgA" })).not.toThrow();
  });

  it("blocks a member from another org's resource", () => {
    expect(() => assertCanAccess(staff, { organisationId: "orgB" })).toThrow(TenantAccessError);
  });

  it("lets a contact access resources tied to their own customer", () => {
    expect(() => assertCanAccess(contact, { organisationId: "orgA", customerId: "custA" })).not.toThrow();
  });

  it("blocks a contact from another customer in the same org", () => {
    expect(() => assertCanAccess(contact, { organisationId: "orgA", customerId: "custB" })).toThrow(TenantAccessError);
  });

  it("blocks a contact from org-level resources with no customer dimension", () => {
    expect(() => assertCanAccess(contact, { organisationId: "orgA" })).toThrow(TenantAccessError);
  });

  it("blocks a contact from a resource in another org entirely", () => {
    expect(() => assertCanAccess(contact, { organisationId: "orgB", customerId: "custA" })).toThrow(TenantAccessError);
  });
});

describe("role gates", () => {
  it("owner passes the owner gate; member does not", () => {
    expect(() => assertIsOwner(owner)).not.toThrow();
    expect(() => assertIsOwner(staff)).toThrow(TenantAccessError);
    expect(() => assertIsOwner(contact)).toThrow(TenantAccessError);
  });

  it("members pass the staff gate; contacts do not", () => {
    expect(() => assertIsMember(staff)).not.toThrow();
    expect(() => assertIsMember(contact)).toThrow(TenantAccessError);
  });
});

describe("magic-link tokens", () => {
  it("generates unique raw tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateRawToken()));
    expect(tokens.size).toBe(100);
  });

  it("hashes deterministically and never returns the raw token", () => {
    const raw = generateRawToken();
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).not.toBe(raw);
  });

  it("compares hashes in constant time, correctly", () => {
    const raw = generateRawToken();
    expect(tokenHashesEqual(hashToken(raw), hashToken(raw))).toBe(true);
    expect(tokenHashesEqual(hashToken(raw), hashToken(generateRawToken()))).toBe(false);
  });

  it("treats a fresh, unconsumed token as usable", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(isTokenUsable({ consumedAt: null, expiresAt: magicLinkExpiry(now) }, now)).toBe(true);
  });

  it("rejects an expired token", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const later = new Date(now.getTime() + MAGIC_LINK_TTL_MS + 1);
    expect(isTokenUsable({ consumedAt: null, expiresAt: magicLinkExpiry(now) }, later)).toBe(false);
  });

  it("rejects an already-consumed token", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    expect(isTokenUsable({ consumedAt: now, expiresAt: magicLinkExpiry(now) }, now)).toBe(false);
  });
});
