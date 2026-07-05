import "server-only";
import { createVerifier } from "@gate/verify";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import type { MemberPrincipal } from "./principal";

/**
 * Server-side bridge to the gate SSO server.
 *
 * Staff (Members) log in through gate on the client (see GateProvider) and send
 * their access token as `Authorization: Bearer <token>` to our route handlers.
 * Here we verify that token against gate's JWKS and resolve it to a Member —
 * and therefore to an Organisation and role, which is all tenant checks need.
 */

// Lazily constructed so that merely importing this module (e.g. during
// `next build` prerender) doesn't require GATE_ISSUER — it's only needed when a
// token is actually verified at runtime.
let _verifier: ReturnType<typeof createVerifier> | undefined;
function getVerifier() {
  if (_verifier) return _verifier;
  const issuer = process.env.GATE_ISSUER;
  if (!issuer) throw new Error("GATE_ISSUER is not set");
  _verifier = createVerifier({
    issuer,
    jwksUri: `${issuer.replace(/\/$/, "")}/.well-known/jwks.json`,
  });
  return _verifier;
}

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

/** Pull the bearer token out of a request's Authorization header. */
export function bearerFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

/**
 * Verify a gate access token and resolve the acting Member. Throws AuthError if
 * the token is invalid or no Member is linked to that gate identity yet.
 *
 * The gate `sub` is globally unique, so it maps to exactly one Member (and thus
 * one Organisation) in the MVP model.
 */
export async function memberFromToken(token: string): Promise<MemberPrincipal> {
  let sub: string;
  try {
    const claims = await getVerifier().verify(token);
    if (!claims.sub) throw new AuthError();
    sub = String(claims.sub);
  } catch {
    throw new AuthError("Invalid or expired token");
  }

  const member = await db.query.members.findFirst({
    where: eq(members.gateUserId, sub),
  });
  if (!member) {
    // Authenticated with gate, but not yet onboarded into any organisation.
    throw new AuthError("No membership for this account");
  }

  return {
    kind: "member",
    memberId: member.id,
    organisationId: member.organisationId,
    role: member.role,
  };
}

/** Convenience: verify straight from an incoming Request. */
export async function memberFromRequest(req: Request): Promise<MemberPrincipal> {
  const token = bearerFromRequest(req);
  if (!token) throw new AuthError();
  return memberFromToken(token);
}
