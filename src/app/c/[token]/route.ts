import { NextResponse } from "next/server";
import { consumeContactToken } from "@/lib/repos/contact-tokens";
import { CONTACT_COOKIE, CONTACT_SESSION_TTL_MS, signContactSession } from "@/lib/contact-session";

type Params = { params: Promise<{ token: string }> };

/**
 * Client magic-link landing. Consumes the single-use token, mints a signed
 * contact session cookie, and redirects into the portal (deep-linking to the
 * request via ?next when it's a safe relative /portal path).
 */
export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const now = new Date();
  const session = await consumeContactToken(token, now);

  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/portal") ? nextParam : "/portal";

  if (!session) {
    return NextResponse.redirect(new URL("/portal/expired", req.url));
  }

  const res = NextResponse.redirect(new URL(safeNext, req.url));
  res.cookies.set(CONTACT_COOKIE, signContactSession(session, now), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CONTACT_SESSION_TTL_MS / 1000,
  });
  return res;
}
