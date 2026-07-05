import { z } from "zod";
import { withMember, parseJson } from "@/lib/route";
import { listTemplates, createTemplate } from "@/lib/repos/templates";

export function GET(req: Request) {
  return withMember(req, (p) => listTemplates(p));
}

const Body = z.object({
  title: z.string().trim().min(1).max(200),
  items: z
    .array(
      z.object({
        type: z.enum(["upload", "question", "approval"]),
        label: z.string().trim().min(1).max(200),
      }),
    )
    .max(50)
    .default([]),
});

export function POST(req: Request) {
  return withMember(req, async (p) => {
    const body = await parseJson(req, Body);
    return createTemplate(p, body);
  });
}
