import { NextResponse } from "next/server";
import { updateRule, removeRule } from "@/lib/categories";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rule = updateRule(id, body);
  if (!rule) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ rule });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = removeRule(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
