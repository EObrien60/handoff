import { withContact } from "@/lib/portal-route";
import { listPortalRequests } from "@/lib/repos/portal";

export function GET() {
  return withContact((s) => listPortalRequests(s));
}
