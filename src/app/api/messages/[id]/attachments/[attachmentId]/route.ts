import { NextResponse } from "next/server";
import { getAttachment } from "@/lib/gmail";
import { hasAccount } from "@/lib/googleAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  const url = new URL(req.url);
  const account = url.searchParams.get("account");
  const rawFilename = url.searchParams.get("filename") || "attachment";

  if (!account || !hasAccount(account)) {
    return NextResponse.json({ error: "Unknown or disconnected account." }, { status: 401 });
  }

  const buffer = await getAttachment(account, id, attachmentId);

  // Attachments are arbitrary, untrusted files (could be HTML/SVG crafted
  // to run script if rendered inline). Serving as a generic octet-stream
  // download — never the attachment's own claimed content type — means
  // the browser always saves it rather than ever rendering it inline in
  // this app's origin.
  const safeName = rawFilename.replace(/[\r\n"]+/g, "_").slice(0, 255);
  const encodedName = encodeURIComponent(safeName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(buffer.length),
    },
  });
}
