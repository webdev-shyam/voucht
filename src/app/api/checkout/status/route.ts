import { NextResponse } from "next/server";
import { isCreemConfigured, isNowPaymentsConfigured } from "@/lib/payments";

// Feature availability only. The UI uses this to mark a payment method as
// unavailable instead of pretending a checkout was started; no key material,
// product ids or account data is returned.
export async function GET() {
  return NextResponse.json({
    creem: isCreemConfigured(),
    nowpayments: isNowPaymentsConfigured(),
  });
}
