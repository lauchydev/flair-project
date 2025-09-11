import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("role", "designer");
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json({ emails: data?.map((u: any) => u.email) || [] });
}
