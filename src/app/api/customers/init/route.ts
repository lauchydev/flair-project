import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "session";

export async function POST() {
  try {
    const store = await cookies(); 
    const raw = store.get(COOKIE_NAME)?.value;
    if (!raw) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const session = JSON.parse(Buffer.from(raw, "base64url").toString());
    const email = String(session.email || "").trim();
    if (!email) return NextResponse.json({ error: "No email in session" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing, error: selErr } = await supabase
      .from("customers")
      .select("id, email, created_at")
      .ilike("email", email)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ customer: existing, created: false });
    }


    const { data: inserted, error: insErr } = await supabase
        .from("customers")
        .insert({ email, password: "" })  
        .select("id, email, created_at")
        .single();



    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ customer: inserted, created: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
