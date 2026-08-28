import { NextResponse } from "next/server";
import { getCategorizedInbox } from "@/lib/inbox";
import { hasAnyAccount } from "@/lib/googleAuth";

export async function POST(req: Request) {
  if (!hasAnyAccount()) {
    return NextResponse.json({ error: "Not connected to Gmail." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pageTokens = body?.pageTokens && typeof body.pageTokens === "object" ? body.pageTokens : undefined;
  const maxResults = Number(body?.maxResults ?? 40);
  const query = typeof body?.query === "string" && body.query.trim() ? body.query.trim() : undefined;

  const result = await getCategorizedInbox({ maxResults, pageTokens, query });
  return NextResponse.json(result);
}
