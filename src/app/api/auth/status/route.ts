import { NextResponse } from "next/server";
import { listAccountEmails } from "@/lib/googleAuth";

export async function GET() {
  return NextResponse.json({ accounts: listAccountEmails() });
}
