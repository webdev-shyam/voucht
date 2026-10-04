import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createNowPaymentsInvoice, isNowPaymentsConfigured } from "@/lib/payments";

const bodySchema = z.object({
  plan: z.enum(["pro", "elite"]),
});

export async function POST(request: Request) {
  try {
    if (!isNowPaymentsConfigured()) {
      return NextResponse.json(
        { ok: false, reason: "not-configured", error: "Crypto payments are not set up yet." },
        { status: 503 }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Choose the Pro or Elite plan." }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Sign in to start a checkout." }, { status: 401 });
    }

    const result = await createNowPaymentsInvoice(parsed.data.plan, {
      userId: user.id,
      email: user.email,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          error:
            result.detail ?? "We could not create the invoice. Please try again.",
        },
        { status: result.reason === "not-configured" ? 503 : 502 }
      );
    }

    return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl });
  } catch (error) {
    console.error("API /api/checkout/nowpayments error:", error);
    return NextResponse.json(
      { ok: false, error: "We could not create the invoice. Please try again." },
      { status: 500 }
    );
  }
}
