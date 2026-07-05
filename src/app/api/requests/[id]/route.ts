import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { getRequest, sendRequest, cancelRequest, completeRequest } from "@/lib/repos/requests";

type Params = { params: Promise<{ id: string }> };

export function GET(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    return getRequest(p, id);
  });
}

const PatchBody = z.object({ action: z.enum(["send", "cancel", "complete"]) });

export function PATCH(req: Request, { params }: Params) {
  return withMember(req, async (p) => {
    const { id } = await params;
    const { action } = await parseJson(req, PatchBody);
    if (action === "send") return sendRequest(p, id);
    if (action === "cancel") return cancelRequest(p, id);
    return completeRequest(p, id);
  });
}
