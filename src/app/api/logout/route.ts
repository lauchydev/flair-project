// src/app/api/logout/route.ts
import { NextResponse } from "next/server";

const COOKIE_NAME = "session";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));

  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",                 // must match how it was set
    maxAge: 0,                 // expire now
    expires: new Date(0),      // belt + suspenders
  });

  return res;
}
