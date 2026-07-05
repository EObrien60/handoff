import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { getCustomer, archiveCustomer } from "@/lib/repos/customers";

type Params = { params: Promise<{ id: string }> };

export function GET(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    return getCustomer(p, id);
  });
}

const PatchBody = z.object({ status: z.literal("archived") });

export function PATCH(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    await parseJson(req, PatchBody);
    return archiveCustomer(p, id);
  });
}
