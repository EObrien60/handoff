import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CONTACT_COOKIE, verifyContactSession, type ContactSession } from "./contact-session";
import { NotFoundError, BadRequestError } from "./route";

/** Read + verify the contact session from cookies (server side). */
export async function currentContact(): Promise<ContactSession | null> {
  const store = await cookies();
  return verifyContactSession(store.get(CONTACT_COOKIE)?.value, new Date());
}

/** Wrap a contact-authenticated route handler. 401 if no valid session. */
export async function withContact(
  fn: (session: ContactSession) => Promise<unknown>,
): Promise<Response> {
  try {
    const session = await currentContact();
    if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const result = await fn(session);
    return NextResponse.json(result ?? { ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    if (err instanceof BadRequestError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof NotFoundError) return NextResponse.json({ error: "not_found" }, { status: 404 });
    console.error("Portal route error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
