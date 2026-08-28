import { NextResponse } from "next/server";
import { listRules, addRule, type MatchType } from "@/lib/categories";

const VALID_MATCH_TYPES: MatchType[] = ["from-domain", "from-contains", "subject-contains", "snippet-contains"];

export async function GET() {
  return NextResponse.json({ rules: listRules() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, matchType, value, color } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!VALID_MATCH_TYPES.includes(matchType)) {
    return NextResponse.json({ error: "invalid matchType" }, { status: 400 });
  }
  if (!value || typeof value !== "string" || !value.trim()) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const rule = addRule({ name, matchType, value, color: typeof color === "string" ? color : undefined });
  return NextResponse.json({ rule }, { status: 201 });
}
