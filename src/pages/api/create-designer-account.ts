import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE" });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from("users")
      .insert({ email, password_hash, role: "designer" })
      .select("id, email, role, created_at")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ user: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unexpected server error" });
  }
}
