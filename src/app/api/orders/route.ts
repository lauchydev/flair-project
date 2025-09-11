import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "session";

async function getSessionEmail() {
  const store = await cookies();                
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString()).email as string | null;
  } catch {
    return null;
  }
}

function makeOrderNumber() {
  return `ORD-${Date.now()}`;
}

export async function POST(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { product_id } = await req.json();
    if (!product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });
    if (!customer) {
      return NextResponse.json({ error: "No customer for this user. Call /api/customers/init first." }, { status: 400 });
    }

    const order_number = makeOrderNumber();

    const { data: order, error: insErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customer.id,
        product_id: String(product_id),
        order_number
      })
      .select("id, order_number, product_id, customer_id, created_at")
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
