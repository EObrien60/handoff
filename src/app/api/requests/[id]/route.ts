import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { getRequest, sendRequest, cancelRequest } from "@/lib/repos/requests";

type Params = { params: Promise<{ id: string }> };

export function GET(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    return getRequest(p, id);
  });
}

const PatchBody = z.object({ action: z.enum(["send", "cancel"]) });

export function PATCH(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    const { action } = await parseJson(req, PatchBody);
    return action === "send" ? sendRequest(p, id) : cancelRequest(p, id);
  });
}
