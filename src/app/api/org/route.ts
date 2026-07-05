import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { getOrg, updateOrg } from "@/lib/repos/org";

export function GET(req: Request) {
  return withMember(req, (p) => getOrg(p));
}

const PatchBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "must be a hex colour like #0d5c4f")
    .optional(),
  logoUrl: z.string().url().max(2000).nullable().optional(),
});

export function PATCH(req: Request) {
  return withMember(req, async (p) => {
    const body = await parseJson(req, PatchBody);
    return updateOrg(p, body);
  });
}
