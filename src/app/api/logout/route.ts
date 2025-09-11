import { NextResponse } from "next/server";

const COOKIE_NAME = "session";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));

  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",                 
    maxAge: 0,                 
    expires: new Date(0),      
  });

  return res;
}
