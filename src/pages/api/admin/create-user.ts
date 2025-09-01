import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, password, role } = req.body || {};
    if (!email || !password || !role) return res.status(400).json({ error: "Missing fields" });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,            // must meet Supabase password policy (default >= 6 chars)
      email_confirm: true, // skip email confirmation (good for admin-created users)
      user_metadata: { role },
    });

    console.log("createUser result:", { data, error });

    if (error) return res.status(400).json({ error: error.message });

    // (Optional) also insert a row in profiles here if you’re not doing it elsewhere
    // await supabaseAdmin.from("profiles").insert({ id: data.user?.id, email, role });

    return res.status(200).json({ ok: true, userId: data.user?.id });
  } catch (e: any) {
    console.error("create-user fatal:", e);
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}

