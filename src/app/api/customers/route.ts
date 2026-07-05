import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { listCustomers, createCustomer } from "@/lib/repos/customers";

export function GET(req: Request) {
  return withMember(req, (p) => listCustomers(p));
}

const CreateBody = z.object({ name: z.string().trim().min(1).max(160) });

export function POST(req: Request) {
  return withMember(req, async (p) => {
    const body = await parseJson(req, CreateBody);
    return createCustomer(p, body);
  });
}
