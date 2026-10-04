import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { readReturnTo, RETURN_TO_COOKIE } from "@/lib/auth-redirect";

const EMAIL_OTP_TYPES: readonly string[] = [
  "signup",
  "confirmation",
  "email",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  // A password-reset link and a sign-in link both arrive here. Supabase labels the
  // former `type=recovery`, which is how the two are told apart now that the
  // redirect URL itself carries no query string. `?next=` is still honoured for
  // links that predate that change.
  const destination =
    type === "recovery"
      ? "/reset-password"
      : readReturnTo(
          requestUrl.searchParams.get("next") ??
            cookies().get(RETURN_TO_COOKIE)?.value
        );

  // Send the visitor back with the destination they came from still attached,
  // otherwise a failed sign-in silently loses the deep link.
  const fail = (errorCode: string, description?: string) => {
    const url = new URL("/login", requestUrl.origin);
    url.searchParams.set("error", errorCode);
    if (description) url.searchParams.set("error_description", description);
    if (destination !== "/dashboard") url.searchParams.set("next", destination);

    const response = NextResponse.redirect(url);
    response.cookies.delete(RETURN_TO_COOKIE);
    return response;
  };

  // GoTrue normally reports provider failures on the Site URL root rather than
  // here, but forward them if one ever arrives.
  const providerError =
    requestUrl.searchParams.get("error_code") ??
    requestUrl.searchParams.get("error");
  if (providerError) {
    return fail(
      providerError,
      requestUrl.searchParams.get("error_description") ?? undefined
    );
  }

  // Nothing to exchange: the visitor landed here directly, or the provider
  // dropped the parameters before redirecting back.
  if (!code && !tokenHash) {
    return fail("missing_oauth_code");
  }

  const supabase = await createClient();

  // OAuth and PKCE email links return a `code`; a project on the implicit flow
  // puts `token_hash` plus the verification type in the link instead. Both end
  // the same way: a session for this browser, then the original destination.
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: (EMAIL_OTP_TYPES.includes(type ?? "")
          ? type
          : "email") as EmailOtpType,
      });

  if (error) {
    console.error("Auth callback error:", error);
    return fail(
      (error as { code?: string }).code ?? "exchange_failed",
      error.message
    );
  }

  const response = NextResponse.redirect(
    new URL(destination, requestUrl.origin)
  );
  // One-shot: a leftover value must not steer the next unrelated sign-in.
  response.cookies.delete(RETURN_TO_COOKIE);
  return response;
}
