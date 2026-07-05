import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, memberFromRequest } from "./gate";
import { TenantAccessError, type MemberPrincipal } from "./principal";

/**
 * Wraps an authenticated staff route handler: resolves the acting Member from
 * the gate token and maps the common error types to HTTP responses. Every
 * mutation/query inside `fn` is expected to scope by `principal.organisationId`.
 */
export async function withMember(
  req: Request,
  fn: (principal: MemberPrincipal) => Promise<unknown>,
): Promise<Response> {
  try {
    const principal = await memberFromRequest(req);
    const result = await fn(principal);
    return NextResponse.json(result ?? { ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof TenantAccessError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: err.issues }, { status: 400 });
    }
    if (err instanceof BadRequestError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof NotFoundError) return NextResponse.json({ error: "not_found" }, { status: 404 });
    console.error("Unhandled route error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(message = "invalid_request") {
    super(message);
    this.name = "BadRequestError";
  }
}

/** Parse + validate a JSON body, throwing ZodError (→ 400) on mismatch. */
export async function parseJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const body = await req.json().catch(() => null);
  return schema.parse(body);
}
