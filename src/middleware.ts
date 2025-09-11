// src/middleware.ts
import { NextResponse, NextRequest } from "next/server";

/** Edge-safe base64url → JSON decode */
function readRole(req: NextRequest) {
  const raw = req.cookies.get("session")?.value;
  if (!raw) return null;
  try {
    // base64url → base64
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded); // Edge runtime has atob
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const role = readRole(req);

  const isAdminRoute =
    pathname.startsWith("/adminpanel") || pathname.startsWith("/admin");

  // Protect all admin routes + make them non-cacheable
  if (isAdminRoute) {
    if (role !== "admin" && role !== "designer") {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return res;
    }
    // Authenticated admin: still mark response as non-cacheable
    return NextResponse.next({
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  // Keep logged-in users off /login
  if (pathname === "/login" && role) {
    const dest = role === "admin" ? "/adminpanel" : "/products";
    return NextResponse.redirect(new URL(dest, origin));
  }

  return NextResponse.next();
}

export const config = {
  // IMPORTANT: include /adminpanel
  matcher: ["/adminpanel/:path*", "/admin/:path*", "/login"],
};
