import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { getValidSupabaseUrl, getValidSupabaseAnonKey } from "./config";

export function createClient() {
  const supabaseUrl = getValidSupabaseUrl();
  const supabaseAnonKey = getValidSupabaseAnonKey();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
