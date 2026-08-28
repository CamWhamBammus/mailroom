import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/gmail";
import { hasAccount } from "@/lib/googleAuth";

const EMAIL_LIST_RE = /^[^\s,]+@[^\s,]+(\s*,\s*[^\s,]+@[^\s,]+)*$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { from, to, subject, body: text, threadId, inReplyTo, references } = body ?? {};

  if (!from || typeof from !== "string" || !hasAccount(from)) {
    return NextResponse.json({ error: "from must be one of your connected accounts" }, { status: 400 });
  }
  if (!to || typeof to !== "string" || !EMAIL_LIST_RE.test(to.trim())) {
    return NextResponse.json({ error: "to must be a valid email address (or comma-separated list)" }, { status: 400 });
  }
  if (!subject || typeof subject !== "string") {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  try {
    const result = await sendMessage({
      from,
      to: to.trim(),
      subject,
      body: text,
      threadId: typeof threadId === "string" ? threadId : undefined,
      inReplyTo: typeof inReplyTo === "string" ? inReplyTo : undefined,
      references: typeof references === "string" ? references : undefined,
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 502 }
    );
  }
}
