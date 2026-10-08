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

// CREEM nests the resource it is reporting on under `object`; only the event
// name and the delivery id sit at the root. Reading the root for product,
// metadata or subscription fields therefore yields undefined, and because this
// handler answers 2xx for events it does not act on, a wrong path does not
// surface as an error — the payment is acknowledged and quietly dropped.
function eventObject(payload: any): any {
  return payload?.object ?? {};
}

function planFromPayload(payload: any): PaidPlan | null {
  const data = eventObject(payload);
  const metadataPlan = String(data.metadata?.plan ?? "").toLowerCase();
  if (metadataPlan === "pro" || metadataPlan === "elite") return metadataPlan;

  // Which object carries the product depends on the event: a checkout names it
  // as a nested `product`, its `order` holds the id as a string, and a
  // checkout's `subscription` does the same.
  const productId = String(
    data.product?.id ?? data.order?.product ?? data.subscription?.product ?? ""
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

  // `eventType` is the field CREEM documents today; older payloads and sample
  // fixtures call it `event`. Reading neither correctly means matching no branch
  // below, which this handler still reports as a success.
  const eventType = String(
    payload?.eventType ?? payload?.event ?? payload?.type ?? ""
  ).toLowerCase();

  const data = eventObject(payload);
  const metadata = data.metadata ?? data.subscription?.metadata ?? {};
  // A subscription event's object *is* the subscription; a checkout event
  // carries the subscription it created nested inside it.
  const subscription = data.object === "subscription" ? data : (data.subscription ?? {});

  const userId = String(metadata.userId ?? metadata.user_id ?? "");
  const plan = planFromPayload(payload);
  // A one-time product creates no subscription, so this stays empty rather
  // than recording the checkout id in a column that means subscription id.
  const providerSubscriptionId = String(subscription.id ?? data.subscription_id ?? "");

  const periodStart = toDate(subscription.current_period_start_date) ?? new Date().toISOString();
  // A checkout event reports no billing period, so the first period is measured
  // from the purchase until `subscription.paid` supplies the real end date.
  const periodEnd = toDate(subscription.current_period_end_date);

  console.log(`[CREEM Webhook] event=${eventType} plan=${plan ?? "unknown"}`);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true, ignored: "database-not-configured" });
  }

  if (!userId || !plan) {
    // Signed but not attributable to an account — nothing to activate.
    return NextResponse.json({ received: true, ignored: "unattributed-event" });
  }

  const supabase = createAdminClient();

  // Only the event names CREEM actually sends: a first payment arrives as
  // `checkout.completed` and then `subscription.active`, renewals as
  // `subscription.paid`. Names from other providers' APIs would never fire here.
  const isActive =
    /(checkout\.completed|subscription\.(active|paid|succeeded|created|revived))/.test(eventType);
  const isCancelled = /(subscription\.(canceled|expired|unpaid|paused))/.test(eventType);
  // A failed renewal is `subscription.past_due`, which keeps the current period
  // running: only `unpaid`/`expired` above cut access off.
  const isFailed = /subscription\.past_due/.test(eventType);

  // supabase-js reports a failed write as return data rather than a thrown
  // error, so every write that carries payment state has to be checked
  // explicitly. Answering 200 for a subscription that never reached the
  // database tells CREEM the delivery is done, the customer stays on Free, and
  // nothing retries it.
  let stateError: string | null = null;

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

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan, plan_expires_at: end })
        .eq("id", userId);

      stateError = subError?.message ?? profileError?.message ?? null;

      if (stateError) {
        console.error("[CREEM Webhook] activation not written:", stateError);
      } else {
        // The audit entry is cosmetic: failing to write it must not make CREEM
        // re-deliver a subscription that is already active.
        await supabase.from("activity_log").insert({
          user_id: userId,
          action: "subscription_changed",
          description: `${plan === "elite" ? "Elite" : "Pro"} subscription is active (renews ${end.slice(0, 10)}).`,
          metadata: { provider: "creem", event: eventType },
        });
      }
    } else if (isCancelled) {
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("payment_provider", "creem");

      // Access stops when the paid period ends, not when the cancel is filed.
      const keepUntil = periodEnd ?? null;
      const { error: profileError } = await supabase
        .from("profiles")
        .update(
          keepUntil && keepUntil > new Date().toISOString()
            ? { plan, plan_expires_at: keepUntil }
            : { plan: "free", plan_expires_at: null }
        )
        .eq("id", userId);

      stateError = subError?.message ?? profileError?.message ?? null;

      if (stateError) {
        console.error("[CREEM Webhook] cancellation not written:", stateError);
      } else {
        await supabase.from("activity_log").insert({
          user_id: userId,
          action: "subscription_changed",
          description:
            "Subscription cancelled. Premium access continues until the paid period ends.",
          metadata: { provider: "creem", event: eventType },
        });
      }
    } else if (isFailed) {
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("payment_provider", "creem");

      if (subError) {
        console.error("[CREEM Webhook] past_due not written:", subError.message);
        stateError = subError.message;
      }

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

  // 5xx is the only signal CREEM acts on, and these writes are idempotent, so a
  // redelivery after a database problem lands the same result.
  if (stateError) {
    return NextResponse.json({ error: "Subscription state not written" }, { status: 500 });
  }

  return NextResponse.json({ received: true, event: eventType });
}
