import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { organisations, members } from "@/db/schema";
import { AuthError, bearerFromRequest, gateIdentityFromToken } from "@/lib/gate";
import { uniqueSlug } from "@/lib/slug";
import { addDays } from "@/lib/dates";

const Body = z.object({ organisationName: z.string().trim().min(1).max(120) });

/**
 * First-run onboarding: a gate-authenticated user with no Member creates their
 * Organisation and becomes its owner. Idempotent — if a Member already exists
 * for this gate identity, we return it rather than creating a duplicate.
 */
export async function POST(req: Request) {
  const token = bearerFromRequest(req);
  if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let identity;
  try {
    identity = await gateIdentityFromToken(token);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const existing = await db.query.members.findFirst({
    where: eq(members.gateUserId, identity.sub),
  });
  if (existing) {
    return NextResponse.json({
      memberId: existing.id,
      organisationId: existing.organisationId,
      role: existing.role,
    });
  }

  const name = parsed.data.organisationName;
  const result = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organisations)
      .values({
        name,
        slug: uniqueSlug(name),
        status: "trialing",
        trialEndsAt: addDays(new Date(), 14),
      })
      .returning();
    const [member] = await tx
      .insert(members)
      .values({
        organisationId: org.id,
        gateUserId: identity.sub,
        email: identity.email,
        role: "owner",
      })
      .returning();
    return { org, member };
  });

  return NextResponse.json({
    memberId: result.member.id,
    organisationId: result.org.id,
    role: result.member.role,
  });
}
