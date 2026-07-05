import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { addContact } from "@/lib/repos/customers";

type Params = { params: Promise<{ id: string }> };

const Body = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(120).optional(),
});

export function POST(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    const body = await parseJson(req, Body);
    return addContact(p, id, body);
  });
}
