import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, parseSessionToken } from "@/lib/auth/sessionToken";

// Optimistic auth gate (see Next.js's auth guide): a cheap, DB-free check
// of the signed session cookie, run on every request before any page or
// API route executes. lib/auth/session.ts re-verifies per request for
// defense in depth — this is the first line, not the only one.

const PUBLIC_PAGE_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/locale"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isPublic = PUBLIC_PAGE_PATHS.includes(pathname) || PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? parseSessionToken(token) : null;

  if (!isPublic && !session) {
    if (isApi) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
