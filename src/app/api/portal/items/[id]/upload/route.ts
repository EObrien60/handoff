import { withContact } from "@/lib/portal-route";
import { BadRequestError } from "@/lib/route";
import { uploadToItem } from "@/lib/repos/portal";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export function POST(req: Request, { params }: Params) {
  return withContact(async (s) => {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new BadRequestError("no file");
    if (file.size > MAX_BYTES) throw new BadRequestError("file too large (max 25 MB)");
    const bytes = Buffer.from(await file.arrayBuffer());
    return uploadToItem(s, id, {
      name: file.name || "upload",
      contentType: file.type || "application/octet-stream",
      bytes,
    });
  });
}
