import { withContact } from "@/lib/portal-route";
import { getPortalRequest } from "@/lib/repos/portal";

type Params = { params: Promise<{ id: string }> };

export function GET(_req: Request, { params }: Params) {
  return withContact(async (s) => {
    const { id } = await params;
    return getPortalRequest(s, id);
  });
}
