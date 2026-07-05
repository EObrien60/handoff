import "server-only";

/**
 * Billing provider seam. Dev uses a stub that "upgrades" instantly via a local
 * confirm URL; production swaps in Stripe Checkout (create a Session, return
 * its URL) with a webhook flipping org.status to active. Same interface, so the
 * app code and settings UI don't change.
 */
export type PlanId = "solo" | "firm" | "studio";

export const PLANS: Record<PlanId, { name: string; price: string }> = {
  solo: { name: "Solo", price: "$29/mo" },
  firm: { name: "Firm", price: "$79/mo" },
  studio: { name: "Studio", price: "$199/mo" },
};

export interface Billing {
  createCheckout(input: { organisationId: string; plan: PlanId }): Promise<{ url: string }>;
}

class DevBilling implements Billing {
  async createCheckout({ organisationId, plan }: { organisationId: string; plan: PlanId }) {
    const appUrl = (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
    // In dev we short-circuit the payment step; the confirm route activates.
    return { url: `${appUrl}/billing/confirm?org=${organisationId}&plan=${plan}` };
  }
}

let _billing: Billing | undefined;
export function billing(): Billing {
  if (_billing) return _billing;
  // A StripeBilling implementation slots in here when STRIPE_SECRET_KEY is set.
  _billing = new DevBilling();
  return _billing;
}

export const billingIsStub = !process.env.STRIPE_SECRET_KEY;
