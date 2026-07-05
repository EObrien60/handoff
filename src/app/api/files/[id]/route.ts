import { NextResponse } from "next/server";
import { AuthError, memberFromRequest } from "@/lib/gate";
import { NotFoundError } from "@/lib/route";
import { TenantAccessError } from "@/lib/principal";
import { getFileForMember } from "@/lib/repos/files";

type Params = { params: Promise<{ id: string }> };

/** Stream a stored file to a staff member, after an org-scoped access check. */
export async function GET(req: Request, { params }: Params) {
  try {
    const principal = await memberFromRequest(req);
    const { id } = await params;
    const { file, bytes } = await getFileForMember(principal, id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": file.contentType ?? "application/octet-stream",
        "content-disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "content-length": String(bytes.length),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof TenantAccessError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (err instanceof NotFoundError) return NextResponse.json({ error: "not_found" }, { status: 404 });
    throw err;
  }
}
