import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types";
import { getValidSupabaseUrl, getValidServiceRoleKey } from "./config";

export function createAdminClient() {
  const supabaseUrl = getValidSupabaseUrl();
  const serviceRoleKey = getValidServiceRoleKey();

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
