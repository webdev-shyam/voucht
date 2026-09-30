import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: readonly string[] = [
  "signup",
  "confirmation",
  "email",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

// A bare startsWith("/") also accepts "//evil.example", which the browser
// resolves to another host, so the double-slash form is rejected too.
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeNext(requestUrl.searchParams.get("next"));

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  // Nothing to exchange: the visitor landed here directly, or the provider
  // dropped the parameters before redirecting back.
  if (!code && !tokenHash) {
    return NextResponse.redirect(
      new URL("/login?error=missing_oauth_code", requestUrl.origin),
    );
  }

  const supabase = await createClient();

  // OAuth and PKCE email links return a `code`; a project on the implicit flow
  // puts `token_hash` plus the verification type in the link instead. Both end
  // the same way: a session for this browser, then the original destination.
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: (EMAIL_OTP_TYPES.includes(type ?? "")
          ? type
          : "email") as EmailOtpType,
      });

  const { error } = result;

  if (error) {
    console.error("Auth callback error:", error);

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
