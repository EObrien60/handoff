import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organisations } from "@/db/schema";
import { NotFoundError } from "@/lib/route";
import { assertIsOwner, type MemberPrincipal } from "@/lib/principal";

export async function getOrg(p: MemberPrincipal) {
  const org = await db.query.organisations.findFirst({ where: eq(organisations.id, p.organisationId) });
  if (!org) throw new NotFoundError();
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    logoUrl: org.logoUrl,
    accentColor: org.accentColor,
    trialEndsAt: org.trialEndsAt,
  };
}

export async function updateOrg(
  p: MemberPrincipal,
  input: { name?: string; accentColor?: string; logoUrl?: string | null },
) {
  assertIsOwner(p); // only owners edit branding
  const [row] = await db
    .update(organisations)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.accentColor !== undefined ? { accentColor: input.accentColor } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, p.organisationId))
    .returning();
  if (!row) throw new NotFoundError();
  return { id: row.id, name: row.name, accentColor: row.accentColor, logoUrl: row.logoUrl };
}
