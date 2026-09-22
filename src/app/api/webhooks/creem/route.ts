import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sendPaymentFailedEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("creem-signature") ||
      request.headers.get("x-creem-signature") ||
      request.headers.get("x-signature");

    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    // 1. Verify webhook signature if secret configured
    if (webhookSecret && webhookSecret !== "your_creem_webhook_secret" && signature) {
      const computedHash = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (computedHash !== signature) {
        console.warn("[CREEM Webhook] Signature mismatch. Received:", signature, "Computed:", computedHash);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const eventType = (payload.event || payload.type || payload.event_type || "").toLowerCase();
    console.log(`[CREEM Webhook] Received event '${eventType}':`, payload);

    // Helper extractors
    const metadata = payload.metadata || payload.data?.metadata || payload.customer?.metadata || {};
    const userId = metadata.userId || metadata.user_id || payload.user_id || payload.customer_id;
    const planRaw = (metadata.plan || payload.product_id || payload.data?.product_id || "pro").toLowerCase();
    const plan: "pro" | "elite" = planRaw.includes("elite") ? "elite" : "pro";
    const providerSubId = payload.subscription_id || payload.id || payload.data?.id || `creem_sub_${Date.now()}`;

    const now = new Date();
    const periodStart = payload.current_period_start
      ? new Date(payload.current_period_start * 1000).toISOString()
      : now.toISOString();

    const periodEnd = payload.current_period_end
      ? new Date(payload.current_period_end * 1000).toISOString()
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (isSupabaseConfigured() && userId) {
      const supabase: any = createAdminClient();

      if (
        eventType === "subscription.created" ||
        eventType === "payment.successful" ||
        eventType === "payment_intent.succeeded" ||
        eventType === "subscription.active" ||
        eventType === "checkout.session.completed"
      ) {
        // Upsert into subscriptions table
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            payment_provider: "creem",
            status: "active",
            provider_subscription_id: String(providerSubId),
            current_period_start: periodStart,
            current_period_end: periodEnd,
            amount: plan === "elite" ? 29 : 10,
            currency: "USD",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Update profiles table
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
          action: `Upgraded to ${plan} plan`,
          description: `Active ${plan.toUpperCase()} subscription via CREEM. Renews ${periodEnd.split("T")[0]}.`,
        });
      } else if (
        eventType === "subscription.cancelled" ||
        eventType === "subscription.deleted" ||
        eventType === "customer.subscription.deleted"
      ) {
        // Update subscriptions
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Update profiles: keep access until period end
        await supabase
          .from("profiles")
          .update({
            plan: "free",
            plan_expires_at: periodEnd,
          })
          .eq("id", userId);

        // Log activity
        await supabase.from("activity_log").insert({
          user_id: userId,
          action: "Subscription cancelled",
          description: "Downgraded to Free tier at period end.",
        });
      } else if (
        eventType === "payment.failed" ||
        eventType === "invoice.payment_failed"
      ) {
        // Update subscriptions status: past_due
        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Fetch user profile email to notify
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          await sendPaymentFailedEmail({
            to: profile.email,
            name: profile.full_name || "Creator",
          });
        }
      }
    } else {
      console.log(`[CREEM Webhook Simulated] Event: ${eventType} for user ${userId} (${plan})`);
    }

    return NextResponse.json({
      received: true,
      event: eventType,
      status: "success",
    });
  } catch (error: any) {
    console.error("[CREEM Webhook Error]:", error);
    // Always return 200 OK so webhook retry queue isn't spammed with parse crashes
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 200 }
    );
  }
}
