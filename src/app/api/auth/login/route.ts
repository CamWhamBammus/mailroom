import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAuthUrl } from "@/lib/googleAuth";

export async function GET() {
  const state = randomUUID();
  const url = getAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
