import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems, files } from "@/db/schema";
import { NotFoundError } from "@/lib/route";
import { fileKey, storage } from "@/lib/storage";
import type { ContactSession } from "@/lib/contact-session";

/**
 * Contact-facing data access. Scoped to the contact's customer (and org) — a
 * contact can only ever see their own customer's requests. This is the second
 * half of the tenant invariant (org + customer).
 */

const CLIENT_VISIBLE: ("sent" | "in_progress" | "submitted" | "completed")[] = [
  "sent",
  "in_progress",
  "submitted",
  "completed",
];

export async function listPortalRequests(s: ContactSession) {
  return db.query.requests.findMany({
    where: and(
      eq(requests.customerId, s.customerId),
      inArray(requests.status, CLIENT_VISIBLE),
    ),
    orderBy: desc(requests.createdAt),
    with: { items: true },
  });
}

export async function getPortalRequest(s: ContactSession, id: string) {
  const row = await db.query.requests.findFirst({
    where: and(eq(requests.id, id), eq(requests.customerId, s.customerId)),
    with: { items: { with: { files: true } } },
  });
  if (!row || !CLIENT_VISIBLE.includes(row.status as (typeof CLIENT_VISIBLE)[number])) {
    throw new NotFoundError();
  }
  return row;
}

/** Load an item and assert it belongs to the contact's customer. */
async function loadOwnedItem(s: ContactSession, itemId: string) {
  const item = await db.query.requestItems.findFirst({
    where: eq(requestItems.id, itemId),
    with: { request: true },
  });
  if (!item || item.request.customerId !== s.customerId) throw new NotFoundError();
  return item;
}

export async function answerQuestion(s: ContactSession, itemId: string, answer: string) {
  const item = await loadOwnedItem(s, itemId);
  if (item.type !== "question") throw new NotFoundError();
  await db
    .update(requestItems)
    .set({ status: "completed", response: { answer }, updatedAt: new Date() })
    .where(eq(requestItems.id, itemId));
  await advanceRequest(item.requestId);
}

export async function decideApproval(
  s: ContactSession,
  itemId: string,
  decision: "approved" | "changes_requested",
  note?: string,
) {
  const item = await loadOwnedItem(s, itemId);
  if (item.type !== "approval") throw new NotFoundError();
  await db
    .update(requestItems)
    .set({
      status: decision === "approved" ? "completed" : "changes_requested",
      response: { decision, note: note ?? null },
      updatedAt: new Date(),
    })
    .where(eq(requestItems.id, itemId));
  await advanceRequest(item.requestId);
}

export async function uploadToItem(
  s: ContactSession,
  itemId: string,
  file: { name: string; contentType: string; bytes: Buffer },
) {
  const item = await loadOwnedItem(s, itemId);
  if (item.type !== "upload") throw new NotFoundError();

  const [row] = await db
    .insert(files)
    .values({
      organisationId: s.organisationId,
      customerId: s.customerId,
      requestItemId: itemId,
      name: file.name,
      storageKey: "", // set below once we have the id
      sizeBytes: file.bytes.length,
      contentType: file.contentType,
      uploadedByContactId: s.contactId,
    })
    .returning();

  const key = fileKey(s.organisationId, s.customerId, row.id);
  await storage().put(key, file.bytes, file.contentType);
  await db.update(files).set({ storageKey: key }).where(eq(files.id, row.id));

  await db
    .update(requestItems)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(requestItems.id, itemId));
  await advanceRequest(item.requestId);

  return { id: row.id, name: row.name };
}

/**
 * Recompute a request's lifecycle from its items:
 *  - any activity  → at least "in_progress"
 *  - all resolved  → "submitted" (ready for the firm to review)
 */
async function advanceRequest(requestId: string) {
  const items = await db.query.requestItems.findMany({ where: eq(requestItems.requestId, requestId) });
  const allDone = items.length > 0 && items.every((i) => i.status === "completed");
  const anyDone = items.some((i) => i.status !== "pending");
  const next = allDone ? "submitted" : anyDone ? "in_progress" : "sent";
  await db.update(requests).set({ status: next, updatedAt: new Date() }).where(eq(requests.id, requestId));
}
