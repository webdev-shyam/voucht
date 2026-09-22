export function getValidSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url && typeof url === "string") {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return trimmed;
        }
      } catch {
        // Fall back if malformed URL
      }
    }
  }
  return "https://placeholder-voucht.supabase.co";
}

export function getValidSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key && typeof key === "string") {
    const trimmed = key.trim();
    if (trimmed.length > 0 && trimmed !== "your_supabase_anon_key") {
      return trimmed;
    }
  }
  return "placeholder-anon-key";
}

export function getValidServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key && typeof key === "string") {
    const trimmed = key.trim();
    if (trimmed.length > 0 && trimmed !== "your_service_role_key") {
      return trimmed;
    }
  }
  return "placeholder-service-role-key";
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url === "your_supabase_url" || key === "your_supabase_anon_key") return false;
  if (url.includes("placeholder") || key.includes("placeholder")) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
