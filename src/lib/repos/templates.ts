import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { requestTemplates, type TemplateItem } from "@/db/schema";
import { NotFoundError } from "@/lib/route";
import type { MemberPrincipal } from "@/lib/principal";

/**
 * Request templates — reusable request skeletons ("Monthly close"). What makes
 * the tool feel built for the vertical and makes the 2nd+ request instant.
 */

export async function listTemplates(p: MemberPrincipal) {
  return db.query.requestTemplates.findMany({
    where: eq(requestTemplates.organisationId, p.organisationId),
    orderBy: desc(requestTemplates.createdAt),
  });
}

export async function getTemplate(p: MemberPrincipal, id: string) {
  const row = await db.query.requestTemplates.findFirst({
    where: and(eq(requestTemplates.id, id), eq(requestTemplates.organisationId, p.organisationId)),
  });
  if (!row) throw new NotFoundError();
  return row;
}

export async function createTemplate(p: MemberPrincipal, input: { title: string; items: TemplateItem[] }) {
  const [row] = await db
    .insert(requestTemplates)
    .values({ organisationId: p.organisationId, title: input.title, items: input.items })
    .returning();
  return row;
}
