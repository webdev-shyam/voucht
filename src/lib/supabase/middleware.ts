import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/lib/types";
import { getValidSupabaseUrl, getValidSupabaseAnonKey, isSupabaseConfigured } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = getValidSupabaseUrl();
  const supabaseAnonKey = getValidSupabaseAnonKey();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data) {
        user = data.user;
      }
    } catch (err) {
      console.warn("Middleware auth session check skipped:", err);
    }
  }

  return { response, user, supabase };
}
