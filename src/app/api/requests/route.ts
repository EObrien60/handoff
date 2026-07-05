import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { listRequests, createRequest } from "@/lib/repos/requests";

export function GET(req: Request) {
  return withMember(req, (p) => listRequests(p));
}

const ItemSchema = z.object({
  type: z.enum(["upload", "question", "approval"]),
  label: z.string().trim().min(1).max(200),
});

const CreateBody = z.object({
  customerId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  items: z.array(ItemSchema).max(50).default([]),
});

export function POST(req: Request) {
  return withMember(req, async (p) => {
    const body = await parseJson(req, CreateBody);
    return createRequest(p, body);
  });
}
