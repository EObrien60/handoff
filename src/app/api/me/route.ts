import { NextResponse } from "next/server";
import { memberFromRequest, AuthError } from "@/lib/gate";

/**
 * Returns the acting Member, resolved from the gate access token in the
 * Authorization header. This is the reference pattern for every authenticated
 * route handler: verify the gate token → get a MemberPrincipal → scope all
 * data access by principal.organisationId.
 */
export async function GET(req: Request) {
  try {
    const principal = await memberFromRequest(req);
    return NextResponse.json({
      memberId: principal.memberId,
      organisationId: principal.organisationId,
      role: principal.role,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
