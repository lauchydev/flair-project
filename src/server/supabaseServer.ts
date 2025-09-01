// src/server/supabaseServer.ts
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

export function getSupabaseServer(req: NextApiRequest, res: NextApiResponse) {
  return createServerSupabaseClient({ req, res });
}
