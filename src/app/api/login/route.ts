
export const runtime = "nodejs"; 

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );


    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role")
      .ilike("email", email.trim())
      .limit(1)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

 
    const value = Buffer.from(
      JSON.stringify({ id: user.id, role: user.role, email: user.email })
    ).toString("base64url");

    const res = NextResponse.json({ id: user.id, email: user.email, role: user.role });

 
    const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${value}; Path=/;${secure} SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
