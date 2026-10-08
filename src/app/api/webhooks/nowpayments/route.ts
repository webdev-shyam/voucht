import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PLAN_PRICES, nowPaymentsIpnSecret, type PaidPlan } from "@/lib/payments";

// NOWPayments signs the IPN with HMAC-SHA512 over the payload JSON with its
// keys recursively sorted alphabetically, sent as `x-nowpayments-sig`.
function sortObject(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== "object" || obj === null) return obj;
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, any>, key: string) => {
      result[key] =
        obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])
          ? sortObject(obj[key])
          : obj[key];
      return result;
    }, {});
}

function verifySignature(payload: unknown, received: string | null): boolean {
  const secret = nowPaymentsIpnSecret();
  if (!secret || !received) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(sortObject(payload as Record<string, any>)))
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let payload: any;
  try {
    payload = JSON.parse((await request.text()) || "{}");
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const receivedSig = request.headers.get("x-nowpayments-sig");

  if (!verifySignature(payload, receivedSig)) {
    console.warn("[NOWPayments IPN] Rejected: missing or mismatched signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { payment_status, order_id, actually_paid, price_amount, payment_id } = payload;
  const orderId = String(order_id ?? "");

  // order_id is minted by our checkout as `${userId}_${plan}`.
  const lastUnderscore = orderId.lastIndexOf("_");
  const userId = lastUnderscore > 0 ? orderId.slice(0, lastUnderscore) : "";
  const planPart = lastUnderscore > 0 ? orderId.slice(lastUnderscore + 1).toLowerCase() : "";
  const plan: PaidPlan | null = planPart === "elite" ? "elite" : planPart === "pro" ? "pro" : null;

  console.log(`[NOWPayments IPN] ${payment_status} for order ${orderId}`);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true, ignored: "database-not-configured" });
  }

  if (payment_status === "finished" || payment_status === "confirmed") {
    if (!userId || !plan) {
      return NextResponse.json({ received: true, ignored: "unattributed-payment" });
    }

    // Crypto has no partial-plan concept: an underpaid invoice does not buy
    // anything. The payer is left on Free and can re-open a checkout.
    const required = Number(price_amount ?? PLAN_PRICES[plan]);
    const paid = Number(actually_paid ?? 0);

    if (!Number.isFinite(required) || !Number.isFinite(paid) || paid < required) {
      console.warn(
        `[NOWPayments IPN] Underpayment ignored: paid ${paid} of ${required} for order ${orderId}`
      );
      return NextResponse.json({ received: true, ignored: "underpaid" });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createAdminClient();

    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        payment_provider: "nowpayments",
        status: "active",
        provider_subscription_id: String(payment_id ?? `np_${now.getTime()}`),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd,
        amount: required,
        currency: "USD",
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) {
      console.error("[NOWPayments IPN] subscription upsert failed:", subError.message);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }

    // `profiles.plan` is what the app reads to gate access, so a subscription
    // row that wrote and a profile that did not is still an unpaid customer.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan, plan_expires_at: periodEnd })
      .eq("id", userId);

    if (profileError) {
      console.error("[NOWPayments IPN] profile plan not written:", profileError.message);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "subscription_changed",
      description: `${plan === "elite" ? "Elite" : "Pro"} unlocked with a crypto payment; access runs to ${periodEnd.slice(0, 10)}.`,
      metadata: { provider: "nowpayments", payment_id: String(payment_id ?? "") },
    });
  }

  return NextResponse.json({ received: true, status: payment_status ?? "acknowledged" });
}
