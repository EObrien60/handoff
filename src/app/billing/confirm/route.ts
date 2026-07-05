import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organisations } from "@/db/schema";
import { billingIsStub } from "@/lib/billing";

/**
 * Dev-only checkout confirmation. Marks the org active — standing in for
 * Stripe's success redirect + webhook. In production (real Stripe configured)
 * this route is disabled; the Stripe webhook activates the subscription.
 */
export async function GET(req: Request) {
  if (!billingIsStub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const url = new URL(req.url);
  const orgId = url.searchParams.get("org");
  if (orgId) {
    await db
      .update(organisations)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(organisations.id, orgId));
  }
  return NextResponse.redirect(new URL("/settings?upgraded=1", req.url));
}
