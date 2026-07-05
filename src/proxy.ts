import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const AUTH_ONLY_PATHS = ["/auth/sign-in", "/auth/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const callbackUrl = `${pathname}${request.nextUrl.search}`;
  const isAuthOnly = AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path));

  // Optimistic check only: does a session cookie exist? This avoids a database
  // round-trip on every navigation. Real session validation and role/permission
  // enforcement must happen server-side in pages and route handlers.
  const hasSessionCookie = Boolean(getSessionCookie(request));

  if (!hasSessionCookie) {
    if (isAuthOnly) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't land on the auth pages.
  if (isAuthOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
