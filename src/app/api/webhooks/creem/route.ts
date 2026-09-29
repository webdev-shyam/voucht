import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sendPaymentFailedEmail } from "@/lib/email";
import { PLAN_PRICES, verifyCreemWebhookSignature, type PaidPlan } from "@/lib/payments";

// CREEM sends `creem-signature`: HMAC-SHA256 of the raw body keyed with the
// webhook secret. A subscription may only change on the strength of that
// signature, so a missing secret or signature is a rejection, not a bypass.
function unauthorized(detail: string) {
  console.warn(`[CREEM Webhook] Rejected: ${detail}`);
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}

function planFromPayload(payload: any): PaidPlan | null {
  const metadataPlan = String(payload?.metadata?.plan ?? "").toLowerCase();
  if (metadataPlan === "pro" || metadataPlan === "elite") return metadataPlan;

  const productId = String(
    payload?.product?.id ?? payload?.product_id ?? payload?.data?.product?.id ?? ""
  );
  if (!productId) return null;

  const eliteId = process.env.CREEM_PRODUCT_ID_ELITE?.trim();
  const proId = process.env.CREEM_PRODUCT_ID_PRO?.trim();
  if (eliteId && productId === eliteId) return "elite";
  if (proId && productId === proId) return "pro";
  return null;
}

// Epoch seconds and ISO strings both appear in CREEM payloads depending on the
// event, so accept either shape.
function toDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: any;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const signature =
    request.headers.get("creem-signature") ||
    request.headers.get("x-creem-signature") ||
    null;

  if (!verifyCreemWebhookSignature(rawBody, signature)) {
    return unauthorized(
      signature ? "signature mismatch or CREEM_WEBHOOK_SECRET unset" : "no signature header"
    );
  }

  const eventType = String(payload?.event ?? payload?.type ?? "").toLowerCase();
  const subscription = payload?.subscription ?? payload?.object?.subscription ?? payload?.data ?? {};

  const userId = String(payload?.metadata?.userId ?? payload?.metadata?.user_id ?? "");
  const plan = planFromPayload(payload);
  const providerSubscriptionId = String(
    subscription?.id ?? payload?.subscription_id ?? payload?.checkout_id ?? ""
  );

  const periodStart =
    toDate(subscription?.current_period_start_date ?? subscription?.current_period_start) ??
    new Date().toISOString();
  const periodEnd = toDate(
    subscription?.current_period_end_date ?? subscription?.current_period_end
  );

  console.log(`[CREEM Webhook] event=${eventType} plan=${plan ?? "unknown"}`);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true, ignored: "database-not-configured" });
  }

  if (!userId || !plan) {
    // Signed but not attributable to an account — nothing to activate.
    return NextResponse.json({ received: true, ignored: "unattributed-event" });
  }

  const supabase = createAdminClient();

  const isActive =
    /(checkout\.completed|transaction\.completed|subscription\.(active|paid|succeeded|created|updated|revived))/.test(
      eventType
    );
  const isCancelled =
    /(subscription\.(cancelled|canceled|deleted|expired|unpaid|paused))/.test(eventType);
  const isFailed = /(payment\.failed|payment_failed|invoice\.payment_failed)/.test(eventType);

  try {
    if (isActive) {
      const end = periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: subError } = await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          payment_provider: "creem",
          status: "active",
          provider_subscription_id: providerSubscriptionId || null,
          current_period_start: periodStart,
          current_period_end: end,
          amount: PLAN_PRICES[plan],
          currency: "USD",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (subError) console.error("[CREEM Webhook] subscription upsert failed:", subError.message);

      await supabase
        .from("profiles")
        .update({ plan, plan_expires_at: end })
        .eq("id", userId);

      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "subscription_changed",
        description: `${plan === "elite" ? "Elite" : "Pro"} subscription is active (renews ${end.slice(0, 10)}).`,
        metadata: { provider: "creem", event: eventType },
      });
    } else if (isCancelled) {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("payment_provider", "creem");

      // Access stops when the paid period ends, not when the cancel is filed.
      const keepUntil = periodEnd ?? null;
      if (keepUntil && keepUntil > new Date().toISOString()) {
        await supabase
          .from("profiles")
          .update({ plan, plan_expires_at: keepUntil })
          .eq("id", userId);
      } else {
        await supabase
          .from("profiles")
          .update({ plan: "free", plan_expires_at: null })
          .eq("id", userId);
      }

      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "subscription_changed",
        description: "Subscription cancelled. Premium access continues until the paid period ends.",
        metadata: { provider: "creem", event: eventType },
      });
    } else if (isFailed) {
      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("payment_provider", "creem");

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.email) {
        await sendPaymentFailedEmail({
          to: profile.email,
          name: profile.full_name || "Creator",
        });
      }
    }
  } catch (error) {
    // A handled error still returns 2xx only for events we do not act on; for
    // acted-on events we return 500 so CREEM retries.
    console.error("[CREEM Webhook] processing error:", error);
    if (isActive || isCancelled || isFailed) {
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true, event: eventType });
}
