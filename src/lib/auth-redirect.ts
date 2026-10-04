// Supabase matches `redirect_to` / `emailRedirectTo` against its Redirect URLs
// allowlist before it will use them. An entry written as a bare path does not
// match the same path carrying a query string, and when the comparison fails
// Supabase does not report anything: it quietly falls back to the Site URL root,
// so the `code` (or `token_hash`) arrives on a page that ignores it and the
// visitor ends up signed out with no error anywhere. Keeping every redirect URL
// this app hands Supabase as a bare path means a single plain allowlist entry is
// enough, and the intended landing page travels in a short-lived cookie instead.

export const RETURN_TO_COOKIE = "voucht_return_to";

function safePath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* an unreadable value just means the default destination */
  }
  // A leading `//` is a valid absolute URL to another host, so reject it.
  return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : null;
}

export function rememberReturnTo(path: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(
    path
  )}; path=/; max-age=600; samesite=lax`;
}

export function readReturnTo(raw: string | null | undefined): string {
  return safePath(raw) ?? "/dashboard";
}

/**
 * The callback URL Supabase should return to. Deliberately carries no query
 * string; see the note above.
 */
export function callbackUrl(origin: string): string {
  return `${origin}/callback`;
}
