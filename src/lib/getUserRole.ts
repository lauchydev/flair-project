import { createClient } from "@supabase/supabase-js";

export async function getUserRole(email: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceKey) return null;

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return data.role || null;
}
