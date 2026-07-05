import { z } from "zod";
import { withContact } from "@/lib/portal-route";
import { decideApproval } from "@/lib/repos/portal";

type Params = { params: Promise<{ id: string }> };
const Body = z.object({
  decision: z.enum(["approved", "changes_requested"]),
  note: z.string().trim().max(2000).optional(),
});

export function POST(req: Request, { params }: Params) {
  return withContact(async (s) => {
    const { id } = await params;
    const { decision, note } = Body.parse(await req.json().catch(() => null));
    await decideApproval(s, id, decision, note);
  });
}
