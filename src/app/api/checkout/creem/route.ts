import { NextResponse } from "next/server";
import { createCreemCheckout } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, userId, email } = body;

    if (!plan || (plan !== "pro" && plan !== "elite")) {
      return NextResponse.json({ error: "Invalid plan. Must be 'pro' or 'elite'." }, { status: 400 });
    }

    const result = await createCreemCheckout(
      plan,
      userId || "usr_anonymous",
      email || "user@example.com"
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/checkout/creem error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
