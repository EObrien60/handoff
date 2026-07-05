import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, contacts } from "@/db/schema";
import { NotFoundError } from "@/lib/route";
import type { MemberPrincipal } from "@/lib/principal";

/**
 * Customer + Contact data access. Every query is scoped by the acting Member's
 * organisationId — the tenant boundary lives here, not in the callers.
 */

export async function listCustomers(p: MemberPrincipal) {
  return db.query.customers.findMany({
    where: and(eq(customers.organisationId, p.organisationId), eq(customers.status, "active")),
    orderBy: desc(customers.createdAt),
    with: { contacts: true },
  });
}

export async function createCustomer(p: MemberPrincipal, input: { name: string }) {
  const [row] = await db
    .insert(customers)
    .values({ organisationId: p.organisationId, name: input.name })
    .returning();
  return row;
}

export async function getCustomer(p: MemberPrincipal, id: string) {
  const row = await db.query.customers.findFirst({
    where: and(eq(customers.id, id), eq(customers.organisationId, p.organisationId)),
    with: { contacts: true },
  });
  if (!row) throw new NotFoundError();
  return row;
}

export async function archiveCustomer(p: MemberPrincipal, id: string) {
  const [row] = await db
    .update(customers)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.organisationId, p.organisationId)))
    .returning();
  if (!row) throw new NotFoundError();
  return row;
}

export async function addContact(
  p: MemberPrincipal,
  customerId: string,
  input: { email: string; name?: string },
) {
  // Ensure the customer belongs to this org before attaching a contact.
  await getCustomer(p, customerId);
  const [row] = await db
    .insert(contacts)
    .values({
      organisationId: p.organisationId,
      customerId,
      email: input.email.toLowerCase(),
      name: input.name,
    })
    .returning();
  return row;
}
