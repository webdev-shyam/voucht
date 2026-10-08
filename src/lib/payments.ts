import crypto from "crypto";
import { originFromEnv } from "@/lib/constants";

// Server-side mirror of the site origin; see the note in src/lib/constants.ts on
// why this has to be the host the app is really served from.
const APP_URL = originFromEnv(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL);

export type PaidPlan = "pro" | "elite";

// Single source of truth for subscription pricing, shared by checkout, the
// webhooks and the billing screen.
export const PLAN_PRICES: Record<PaidPlan, number> = { pro: 10, elite: 29 };

// A provider rejection is worth showing the visitor, but only in mapped form:
// the response body can echo account and order data back at us, and the raw
// text would then leave this server through the browser. The status code and
// the public API host name are enough to act on — a 401 against the sandbox
// host means a live key was pasted into a sandbox deployment, which is the
// single most common way this fails.
function describeHttpFailure(
  provider: "CREEM" | "NOWPayments",
  status: number,
  baseUrl: string
): string {
  const environment = baseUrl.includes("sandbox")
    ? "sandbox"
    : baseUrl.includes("test-")
      ? "test"
      : "live";

  if (status === 401 || status === 403) {
    return `${provider} rejected the API key for its ${environment} environment (HTTP ${status}). Check that the key and the endpoint belong to the same environment.`;
  }
  if (status === 404) {
    return `${provider} has no such endpoint at ${baseUrl} (HTTP 404).`;
  }
  if (status === 400 || status === 422) {
    return `${provider} refused the payment request (HTTP ${status}). The plan price, currency or product id is not valid on the account.`;
  }
  if (status === 429) {
    return `${provider} rate-limited the request (HTTP 429). Try again in a minute.`;
  }
  if (status >= 500) {
    return `${provider} is unavailable right now (HTTP ${status}). Try again shortly.`;
  }
  return `${provider} responded HTTP ${status}.`;
}

// This project compiles with `strict: false`, so a discriminated union would
// not narrow at the call sites. One flat result object keeps `ok`/`reason`
// readable everywhere without weakening the values that may appear.
export interface CheckoutResult {
  ok: boolean;
  checkoutUrl?: string;
  reason?: "not-configured" | "provider-error";
  detail?: string;
}

function cleanEnv(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v || v.startsWith("your_") || v.includes("placeholder")) return null;
  return v;
}

// ------------------------------------------------------------------ CREEM

interface CreemConfig {
  apiKey: string;
  baseUrl: string;
}

export function getCreemConfig(): CreemConfig | null {
  const apiKey = cleanEnv(process.env.CREEM_API_KEY);
  if (!apiKey) return null;

  const explicitBase = cleanEnv(process.env.CREEM_API_BASE);
  if (explicitBase) return { apiKey, baseUrl: explicitBase.replace(/\/$/, "") };

  // CREEM picks the environment by host rather than by the key, so
  // CREEM_TEST_MODE is the reliable switch; the prefix only helps when a test
  // key happens to carry one.
  const isTest = apiKey.startsWith("creem_test_") || process.env.CREEM_TEST_MODE === "true";
  return {
    apiKey,
    baseUrl: isTest ? "https://test-api.creem.io/v1" : "https://api.creem.io/v1",
  };
}

function creemProductId(plan: PaidPlan): string | null {
  return cleanEnv(
    plan === "elite" ? process.env.CREEM_PRODUCT_ID_ELITE : process.env.CREEM_PRODUCT_ID_PRO
  );
}

// CREEM has one product id per plan, so a deployment can sell Pro while Elite is
// still being set up. Reporting availability all-or-nothing made that read as
// "card payments are not set up" even with a working Pro product.
export function creemPlanAvailability(): Record<PaidPlan, boolean> {
  const hasKey = !!getCreemConfig();
  return {
    pro: hasKey && !!creemProductId("pro"),
    elite: hasKey && !!creemProductId("elite"),
  };
}

export function isCreemConfigured(plan?: PaidPlan): boolean {
  const availability = creemPlanAvailability();
  return plan ? availability[plan] : availability.pro || availability.elite;
}

export async function createCreemCheckout(
  plan: PaidPlan,
  options: { userId: string; email: string }
): Promise<CheckoutResult> {
  const config = getCreemConfig();
  if (!config) return { ok: false, reason: "not-configured" };

  const productId = creemProductId(plan);
  if (!productId) return { ok: false, reason: "not-configured" };

  try {
    const res = await fetch(`${config.baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        // request_id ties the provider record back to this account and makes a
        // retry from the same browser tab idempotent.
        request_id: `voucht_${options.userId}_${plan}_${Date.now()}`,
        customer: { email: options.email },
        metadata: { userId: options.userId, plan },
        success_url: `${APP_URL}/dashboard/billing?provider=creem&pending=true`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("CREEM checkout failed:", res.status, detail.slice(0, 400));
      return {
        ok: false,
        reason: "provider-error",
        detail: describeHttpFailure("CREEM", res.status, config.baseUrl),
      };
    }

    const data = (await res.json()) as { checkout_url?: string };
    if (!data.checkout_url) {
      return { ok: false, reason: "provider-error", detail: "CREEM returned no checkout URL" };
    }

    return { ok: true, checkoutUrl: data.checkout_url };
  } catch (error) {
    console.error("CREEM checkout error:", error);
    return { ok: false, reason: "provider-error", detail: "Network error talking to CREEM" };
  }
}

// CREEM appends `checkout_id` and `signature` to the success redirect. The
// signature is SHA-256 over `${checkout_id}${API_KEY}`. It proves the visitor
// came back through CREEM, but it is NOT proof of a paid subscription — only
// the signed webhook activates a plan.
export function verifyCreemCheckoutSignature(checkoutId: string, signature: string): boolean {
  const config = getCreemConfig();
  if (!config || !checkoutId || !signature) return false;

  const expected = crypto
    .createHash("sha256")
    .update(`${checkoutId}${config.apiKey}`)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function creemWebhookSecret(): string | null {
  return cleanEnv(process.env.CREEM_WEBHOOK_SECRET);
}

export function verifyCreemWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = creemWebhookSecret();
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

// ------------------------------------------------------------- NOWPayments

export function getNowPaymentsConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = cleanEnv(process.env.NOWPAYMENTS_API_KEY);
  if (!apiKey) return null;

  const useSandbox =
    apiKey.startsWith("sandbox_") ||
    process.env.NOWPAYMENTS_SANDBOX === "true" ||
    process.env.NOWPAYMENTS_SANDBOX === "1";

  return {
    apiKey,
    baseUrl: useSandbox
      ? "https://api-sandbox.nowpayments.io/v1"
      : "https://api.nowpayments.io/v1",
  };
}

export function isNowPaymentsConfigured(): boolean {
  return !!getNowPaymentsConfig() && !!cleanEnv(process.env.NOWPAYMENTS_IPN_SECRET);
}

export async function createNowPaymentsInvoice(
  plan: PaidPlan,
  options: { userId: string; email: string }
): Promise<CheckoutResult> {
  const config = getNowPaymentsConfig();
  if (!config) return { ok: false, reason: "not-configured" };

  const amount = PLAN_PRICES[plan];

  try {
    const res = await fetch(`${config.baseUrl}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: "usd",
        order_id: `${options.userId}_${plan}`,
        order_description: `Voucht ${plan} plan (30 days) for ${options.email}`,
        ipn_callback_url: `${APP_URL}/api/webhooks/nowpayments`,
        // Crypto payments are only confirmed once the IPN reports the network
        // status, so the success page is labelled as pending, never as paid.
        success_url: `${APP_URL}/dashboard/billing?provider=nowpayments&pending=true`,
        cancel_url: `${APP_URL}/dashboard/billing`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("NOWPayments invoice failed:", res.status, detail.slice(0, 400));
      return {
        ok: false,
        reason: "provider-error",
        detail: describeHttpFailure("NOWPayments", res.status, config.baseUrl),
      };
    }

    const data = (await res.json()) as { invoice_url?: string };
    if (!data.invoice_url) {
      return {
        ok: false,
        reason: "provider-error",
        detail: "NOWPayments returned no invoice URL",
      };
    }

    return { ok: true, checkoutUrl: data.invoice_url };
  } catch (error) {
    console.error("NOWPayments invoice error:", error);
    return { ok: false, reason: "provider-error", detail: "Network error talking to NOWPayments" };
  }
}

export function nowPaymentsIpnSecret(): string | null {
  return cleanEnv(process.env.NOWPAYMENTS_IPN_SECRET);
}
