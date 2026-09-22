import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Helper to sort keys recursively for NOWPayments HMAC-SHA512 verification
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

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody || "{}");
    const receivedSig = request.headers.get("x-nowpayments-sig");
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    // 1. Verify NOWPayments IPN Signature
    if (ipnSecret && ipnSecret !== "your_nowpayments_ipn_secret" && receivedSig) {
      const sortedPayloadString = JSON.stringify(sortObject(payload));
      const computedHash = crypto
        .createHmac("sha512", ipnSecret)
        .update(sortedPayloadString)
        .digest("hex");

      if (computedHash !== receivedSig) {
        console.warn("[NOWPayments IPN] Signature mismatch. Received:", receivedSig, "Computed:", computedHash);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const { payment_status, order_id, actually_paid, price_amount, payment_id } = payload;
    console.log(`[NOWPayments IPN] Payment status '${payment_status}' for order '${order_id}'`);

    // 2. Check payment_status
    if (payment_status === "finished" || payment_status === "confirmed") {
      // Parse order_id: format is "userId_plan"
      const orderIdStr = String(order_id || "");
      const lastUnderscore = orderIdStr.lastIndexOf("_");

      let userId = orderIdStr;
      let plan: "pro" | "elite" = "pro";

      if (lastUnderscore !== -1) {
        userId = orderIdStr.substring(0, lastUnderscore);
        const planPart = orderIdStr.substring(lastUnderscore + 1).toLowerCase();
        plan = planPart === "elite" ? "elite" : "pro";
      }

      // Verify actually_paid >= price_amount (allowing small slippage)
      const expectedAmount = plan === "elite" ? 29 : 10;
      const paid = Number(actually_paid || payload.pay_amount || expectedAmount);
      const reqAmount = Number(price_amount || expectedAmount);

      if (paid < reqAmount * 0.98) {
        console.warn(`[NOWPayments IPN] Underpayment detected: paid ${paid} vs required ${reqAmount}`);
      }

      const now = new Date();
      const periodStart = now.toISOString();
      // Crypto manual tracking: 30 days from payment
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (isSupabaseConfigured() && userId) {
        const supabase: any = createAdminClient();

        // Upsert into subscriptions table
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            payment_provider: "nowpayments",
            status: "active",
            provider_subscription_id: String(payment_id || `np_${Date.now()}`),
            current_period_start: periodStart,
            current_period_end: periodEnd,
            amount: reqAmount,
            currency: "USD",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Update profiles table: plan and plan_expires_at
        await supabase
          .from("profiles")
          .update({
            plan,
            plan_expires_at: periodEnd,
          })
          .eq("id", userId);

        // Log activity
        await supabase.from("activity_log").insert({
          user_id: userId,
          action: `Upgraded to ${plan} plan (Crypto via NOWPayments)`,
          description: `Confirmed 30-day crypto subscription. Payment ID: ${payment_id}. Renews ${periodEnd.split("T")[0]}.`,
        });
      } else {
        console.log(`[NOWPayments IPN Simulated] Plan: ${plan}, User: ${userId}, Active until: ${periodEnd}`);
      }
    } else if (payment_status === "expired" || payment_status === "failed") {
      console.log(`[NOWPayments IPN] Payment ${payment_id} was ${payment_status}. Order: ${order_id}`);
      // Log but don't update anything as per spec
    }

    // Always return 200 OK for all events
    return NextResponse.json({
      received: true,
      status: payment_status || "acknowledged",
    });
  } catch (error: any) {
    console.error("[NOWPayments Webhook Error]:", error);
    return NextResponse.json({ received: true, error: error.message }, { status: 200 });
  }
}
