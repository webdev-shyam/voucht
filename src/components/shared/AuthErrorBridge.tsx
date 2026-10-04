"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface AuthError {
  code: string;
  message: string;
}

// Supabase does not report OAuth failures to /callback. When the provider exchange
// fails it redirects to the *Site URL root* with ?error_code=…&error_description=…,
// and repeats them in the URL hash. Handling them only on the login page meant every
// failed Google sign-in landed on a page that read none of those parameters, so the
// visitor was bounced around with no explanation at all.
const MESSAGES: Record<string, string> = {
  missing_oauth_code:
    "The provider returned no authorisation code. Google sign-in is usually not enabled, or this URL is missing from its redirect allow-list.",
  bad_oauth_state:
    "This sign-in attempt was already used or has expired — an old browser tab, the back button, or pressing Continue with Google twice all cause it. Start again from the login page.",
  bad_oauth_callback:
    "The reply from Google arrived without a valid state, so it could not be matched to a sign-in attempt. Start again from the login page.",
  provider_callback_failed:
    "Google refused to complete the sign-in. The Client ID or the redirect URI registered with Supabase does not match what Google expects.",
  access_denied:
    "The sign-in was cancelled before it finished. Press Continue with Google and accept the consent prompt.",
  consent_required:
    "Google required a consent step that the app has not been granted yet. Retry and approve the requested permissions.",
  user_blocked_request:
    "Google blocked this sign-in request, usually because the OAuth app is unverified and the account is in an organisation with strict policies.",
  invalid_client:
    "Google does not recognise the OAuth client ID configured in Supabase. Re-check the Client ID on the Google provider.",
  id_token_invalid_issuer:
    "Google returned a token from an unexpected issuer, so Supabase rejected the sign-in.",
  unexpected_failure:
    "Supabase hit an internal error while exchanging the Google credential. The details are shown below.",
  server_error:
    "Supabase reported a server error while signing in. The details are shown below.",
  email_not_confirmed:
    "This account exists but its address has not been confirmed yet. Open the confirmation email, or resend it from the login page.",
  over_request_limit:
    "Too many sign-in attempts reached the rate limit. Wait a minute and try again.",
};

function decode(raw: string | null): string | null {
  if (!raw) return null;
  let out = raw.replace(/\+/g, " ");
  try {
    out = decodeURIComponent(out);
    // Supabase encodes the hash copy once more than the query copy.
    if (out.includes("%")) out = decodeURIComponent(out);
  } catch {
    /* leave as-is rather than losing the message */
  }
  return out.trim() || null;
}

function readParams(source: string): URLSearchParams {
  return new URLSearchParams(source.replace(/^[?#]/, ""));
}

function pickError(...sources: URLSearchParams[]): AuthError | null {
  for (const params of sources) {
    const code =
      params.get("error_code") ??
      params.get("error") ??
      params.get("error_description");
    if (!code) continue;

    const description = decode(params.get("error_description"));
    const known = MESSAGES[code];
    return {
      code,
      message:
        known && (!description || known === description)
          ? known
          : description
            ? `${known ?? "Sign-in did not complete."} (${description})`
            : known ?? `Sign-in did not complete (${code.replace(/_/g, " ")}).`,
    };
  }
  return null;
}

export function AuthErrorBridge() {
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const { search, hash } = window.location;
    if (!search && !hash) return;

    const found = pickError(readParams(search), readParams(hash));
    if (!found) return;

    setError(found);

    // Drop the parameters without navigating, so refreshing the page does not
    // re-show a stale failure and the address bar stays readable.
    const clean = new URLSearchParams(search);
    for (const key of ["error", "error_code", "error_description", "sb"]) {
      clean.delete(key);
    }
    const query = clean.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );
  }, []);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] border-b border-[#ff5c7c]/40 bg-[#2a1030]/95 backdrop-blur-sm px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white leading-relaxed">{error.message}</p>
          <p className="mt-1 text-[10px] text-[#a0a0b8]">
            Error code: {error.code}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          aria-label="Dismiss sign-in error"
          className="shrink-0 rounded-md p-1 text-[#a0a0b8] hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
