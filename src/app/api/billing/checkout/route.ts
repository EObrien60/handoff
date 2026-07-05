import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { assertIsOwner } from "@/lib/principal";
import { billing, type PlanId } from "@/lib/billing";

const Body = z.object({ plan: z.enum(["solo", "firm", "studio"]) });

/** Start a checkout for the given plan. Owner-only. */
export function POST(req: Request) {
  return withMember(req, async (p) => {
    assertIsOwner(p);
    const { plan } = await parseJson(req, Body);
    return billing().createCheckout({ organisationId: p.organisationId, plan: plan as PlanId });
  });
}
