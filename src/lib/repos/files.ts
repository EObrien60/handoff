import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";
import { NotFoundError } from "@/lib/route";
import { storage } from "@/lib/storage";
import type { MemberPrincipal } from "@/lib/principal";

/** Load a file's bytes for a staff member, scoped to their organisation. */
export async function getFileForMember(p: MemberPrincipal, id: string) {
  const file = await db.query.files.findFirst({
    where: and(eq(files.id, id), eq(files.organisationId, p.organisationId)),
  });
  if (!file) throw new NotFoundError();
  const bytes = await storage().get(file.storageKey);
  return { file, bytes };
}
