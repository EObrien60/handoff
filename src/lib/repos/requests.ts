import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems, customers, contacts, organisations } from "@/db/schema";
import { NotFoundError } from "@/lib/route";
import { issueContactToken } from "./contact-tokens";
import { mailer } from "@/lib/mail";
import type { MemberPrincipal } from "@/lib/principal";

export type NewItem = { type: "upload" | "question" | "approval"; label: string };

/**
 * Request data access. A Request is the wedge: a checklist of upload / question
 * / approval items sent to a client. Scoped by organisationId throughout.
 */

export async function listRequests(p: MemberPrincipal) {
  return db.query.requests.findMany({
    where: eq(requests.organisationId, p.organisationId),
    orderBy: desc(requests.createdAt),
    with: {
      customer: { columns: { id: true, name: true } },
      items: { columns: { id: true, status: true } },
    },
  });
}

export async function getRequest(p: MemberPrincipal, id: string) {
  const row = await db.query.requests.findFirst({
    where: and(eq(requests.id, id), eq(requests.organisationId, p.organisationId)),
    with: {
      customer: { with: { contacts: true } },
      items: { with: { files: true } },
    },
  });
  if (!row) throw new NotFoundError();
  return row;
}

export async function createRequest(
  p: MemberPrincipal,
  input: { customerId: string; title: string; items: NewItem[] },
) {
  // Verify the customer is in this org before creating.
  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, input.customerId), eq(customers.organisationId, p.organisationId)),
  });
  if (!customer) throw new NotFoundError();

  return db.transaction(async (tx) => {
    const [request] = await tx
      .insert(requests)
      .values({
        organisationId: p.organisationId,
        customerId: input.customerId,
        title: input.title,
        status: "draft",
        createdByMemberId: p.memberId,
      })
      .returning();

    if (input.items.length) {
      await tx.insert(requestItems).values(
        input.items.map((item, i) => ({
          organisationId: p.organisationId,
          requestId: request.id,
          type: item.type,
          label: item.label,
          position: i,
        })),
      );
    }
    return request;
  });
}

/**
 * Move a request to "sent" and email each of the client's contacts a
 * single-use magic link that deep-links to the request in their portal.
 */
export async function sendRequest(p: MemberPrincipal, id: string) {
  const [row] = await db
    .update(requests)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(requests.id, id),
        eq(requests.organisationId, p.organisationId),
        inArray(requests.status, ["draft", "sent"]),
      ),
    )
    .returning();
  if (!row) throw new NotFoundError();

  const [org, recipients] = await Promise.all([
    db.query.organisations.findFirst({ where: eq(organisations.id, p.organisationId) }),
    db.query.contacts.findMany({ where: eq(contacts.customerId, row.customerId) }),
  ]);

  const appUrl = (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const firmName = org?.name ?? "your accountant";
  const now = new Date();

  await Promise.all(
    recipients.map(async (contact) => {
      const token = await issueContactToken(contact.id, now);
      const link = `${appUrl}/c/${token}?next=${encodeURIComponent(`/portal/r/${row.id}`)}`;
      await mailer().send({
        to: contact.email,
        subject: `${firmName} needs a few things from you`,
        text: `Hi${contact.name ? ` ${contact.name}` : ""},\n\n${firmName} has sent you a request: "${row.title}".\n\nOpen it here (no password needed):\n${link}\n\nThis link expires in 15 minutes; you can always request a new one.`,
      });
    }),
  );

  return { ...row, sentTo: recipients.length };
}

export async function cancelRequest(p: MemberPrincipal, id: string) {
  const [row] = await db
    .update(requests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(requests.id, id), eq(requests.organisationId, p.organisationId)))
    .returning();
  if (!row) throw new NotFoundError();
  return row;
}

/** Firm marks a submitted request as reviewed/completed. */
export async function completeRequest(p: MemberPrincipal, id: string) {
  const [row] = await db
    .update(requests)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(requests.id, id), eq(requests.organisationId, p.organisationId)))
    .returning();
  if (!row) throw new NotFoundError();
  return row;
}
