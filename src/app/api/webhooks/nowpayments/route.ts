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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const {
    payment_status,
    order_id,
    actually_paid,
    pay_amount,
    pay_currency,
    price_amount,
    price_currency,
    payment_id,
  } = payload;

  // order_id is minted by checkout as `${userId}_${plan}_${attempt}`.
  // Strip the attempt nonce, then split the UUID from the plan.
  const rawOrderId = String(order_id ?? "");
  const orderId = rawOrderId.replace(/_\d+$/, "");
  const lastUnderscore = orderId.lastIndexOf("_");
  const userId = lastUnderscore > 0 ? orderId.slice(0, lastUnderscore) : "";
  const planPart = lastUnderscore > 0 ? orderId.slice(lastUnderscore + 1).toLowerCase() : "";
  const plan: PaidPlan | null = planPart === "elite" ? "elite" : planPart === "pro" ? "pro" : null;

  console.log(`[NOWPayments IPN] ${payment_status} for order ${orderId}`);

  // Pending and failed events do not change subscription state.
  if (payment_status !== "finished" && payment_status !== "confirmed") {
    return NextResponse.json({ received: true, status: payment_status ?? "acknowledged" });
  }

  if (!userId || !UUID_PATTERN.test(userId) || !plan || !String(payment_id ?? "").trim()) {
    console.warn("[NOWPayments IPN] Final payment could not be attributed to an account");
    return NextResponse.json({ received: true, ignored: "unattributed-payment" });
  }

  // price_amount is fiat (USD); pay_amount and actually_paid are crypto.
  // Never compare values expressed in different currencies.
  const expectedUsd = PLAN_PRICES[plan];
  const receivedUsd = Number(price_amount);
  const expectedCrypto = Number(pay_amount);
  const paidCrypto = Number(actually_paid);
  const fiatCurrency = String(price_currency ?? "").trim().toUpperCase();
  const cryptoCurrency = String(pay_currency ?? "").trim().toLowerCase();

  if (
    fiatCurrency !== "USD" ||
    !Number.isFinite(receivedUsd) ||
    Math.abs(receivedUsd - expectedUsd) > 0.01 ||
    !cryptoCurrency ||
    !Number.isFinite(expectedCrypto) ||
    expectedCrypto <= 0 ||
    !Number.isFinite(paidCrypto) ||
    paidCrypto <= 0
  ) {
    console.warn(`[NOWPayments IPN] Invalid payment amounts or currencies for order ${orderId}`);
    return NextResponse.json({ received: true, ignored: "invalid-payment-details" });
  }

  // Allow only a tiny floating-point rounding margin. A material underpayment
  // must not unlock a paid plan.
  const cryptoTolerance = Math.max(expectedCrypto * 1e-8, 1e-12);
  if (paidCrypto + cryptoTolerance < expectedCrypto) {
    console.warn(
      `[NOWPayments IPN] Underpayment ignored: received ${paidCrypto} ${cryptoCurrency}; expected ${expectedCrypto} ${cryptoCurrency}`
    );
    return NextResponse.json({ received: true, ignored: "underpaid" });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  const supabase = createAdminClient();

  // This RPC records the provider payment ID and applies the subscription
  // update in one database transaction. Duplicate IPNs therefore cannot grant
  // extra billing time, including when NOWPayments retries concurrently.
  const { data, error } = await supabase.rpc("process_nowpayments_payment", {
    p_payment_id: String(payment_id),
    p_user_id: userId,
    p_plan: plan,
    p_order_id: rawOrderId,
    p_price_amount: receivedUsd,
    p_price_currency: fiatCurrency,
    p_pay_currency: cryptoCurrency,
    p_pay_amount: expectedCrypto,
    p_actually_paid: paidCrypto,
  });

  if (error) {
    console.error("[NOWPayments IPN] Atomic payment processing failed:", error.message);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  if (data?.duplicate) {
    console.log(`[NOWPayments IPN] Duplicate payment ${payment_id} acknowledged`);
  } else if (data?.success !== true) {
    console.error("[NOWPayments IPN] Payment RPC returned an unexpected result");
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({
    received: true,
    status: payment_status,
    duplicate: Boolean(data?.duplicate),
  });
}
