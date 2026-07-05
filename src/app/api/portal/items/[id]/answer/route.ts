import { z } from "zod";
import { withContact } from "@/lib/portal-route";
import { answerQuestion } from "@/lib/repos/portal";

type Params = { params: Promise<{ id: string }> };
const Body = z.object({ answer: z.string().trim().min(1).max(5000) });

export function POST(req: Request, { params }: Params) {
  return withContact(async (s) => {
    const { id } = await params;
    const { answer } = Body.parse(await req.json().catch(() => null));
    await answerQuestion(s, id, answer);
  });
}
