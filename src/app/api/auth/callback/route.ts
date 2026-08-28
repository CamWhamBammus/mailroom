import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const expectedState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("oauth_state="))
    ?.split("=")[1];

  const clearStateCookie = (res: NextResponse) => {
    res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  };

  if (error) {
    return clearStateCookie(
      NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, url.origin))
    );
  }
  if (!code || !state || state !== expectedState) {
    return clearStateCookie(NextResponse.redirect(new URL("/login?error=invalid_state", url.origin)));
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return clearStateCookie(
      NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, url.origin))
    );
  }

  return clearStateCookie(NextResponse.redirect(new URL("/", url.origin)));
}
