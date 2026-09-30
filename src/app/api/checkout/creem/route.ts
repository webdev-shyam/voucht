import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createCreemCheckout, isCreemConfigured } from "@/lib/payments";

const bodySchema = z.object({
  plan: z.enum(["pro", "elite"]),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Choose the Pro or Elite plan." }, { status: 400 });
    }

    if (!isCreemConfigured(parsed.data.plan)) {
      return NextResponse.json(
        {
          ok: false,
          reason: "not-configured",
          error: `Card checkout for the ${parsed.data.plan} plan is not set up yet.`,
        },
        { status: 503 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // The account and email come from the verified session: a checkout may
    // never be created for a user id supplied by the browser.
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Sign in to start a checkout." }, { status: 401 });
    }

    const result = await createCreemCheckout(parsed.data.plan, {
      userId: user.id,
      email: user.email,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason, error: "We could not start the checkout. Please try again." },
        { status: result.reason === "not-configured" ? 503 : 502 }
      );
    }

    return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl });
  } catch (error) {
    console.error("API /api/checkout/creem error:", error);
    return NextResponse.json(
      { ok: false, error: "We could not start the checkout. Please try again." },
      { status: 500 }
    );
  }
}
