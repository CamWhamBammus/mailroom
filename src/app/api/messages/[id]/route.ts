import { NextResponse } from "next/server";
import { getSanitizedMessage } from "@/lib/messageDetail";
import { hasAccount } from "@/lib/googleAuth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const account = url.searchParams.get("account");
  const allowRemoteImages = url.searchParams.get("showImages") === "1";

  if (!account || !hasAccount(account)) {
    return NextResponse.json({ error: "Unknown or disconnected account." }, { status: 401 });
  }

  const message = await getSanitizedMessage(account, id, allowRemoteImages);
  return NextResponse.json(message);
}
