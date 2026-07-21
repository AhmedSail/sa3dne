import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const AUTH_ONLY_PATHS = ["/auth/sign-in", "/auth/sign-up"];

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/feedback", "/track", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const callbackUrl = `${pathname}${request.nextUrl.search}`;
  const isAuthOnly = AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path));
  const isPublic = pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // Allow public paths without any cookie check
  if (isPublic) {
    return NextResponse.next();
  }

  // Optimistic check only: does a session cookie exist? This avoids a database
  // round-trip on every navigation. Real session validation and role/permission
  // enforcement must happen server-side in pages and route handlers.
  const hasSessionCookie = Boolean(getSessionCookie(request));

  // No cookie: allow auth pages, redirect everything else to sign-in
  if (!hasSessionCookie) {
    if (isAuthOnly) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  // Has cookie: let everything through.
  // NOTE: We intentionally do NOT redirect from auth pages here.
  // If the cookie is stale/expired, the page-level session check will
  // redirect to sign-in. Redirecting from auth pages based on cookie alone
  // causes an infinite loop when the cookie is expired.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
