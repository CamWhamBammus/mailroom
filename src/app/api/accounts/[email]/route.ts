import { NextResponse } from "next/server";
import { removeAccount } from "@/lib/googleAuth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const ok = removeAccount(decodeURIComponent(email));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
