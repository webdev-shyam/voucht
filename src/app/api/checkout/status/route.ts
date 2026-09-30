import { NextResponse } from "next/server";
import { creemPlanAvailability, isNowPaymentsConfigured } from "@/lib/payments";

// Feature availability only. The UI uses this to mark a payment method as
// unavailable instead of pretending a checkout was started; no key material,
// product ids or account data is returned.
//
// Without this the route has no dynamic input, so the build pre-renders it and
// the answer is frozen at build time: adding the CREEM keys afterwards would
// keep reporting "unavailable" until the next deploy.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    creem: creemPlanAvailability(),
    nowpayments: isNowPaymentsConfigured(),
  });
}
