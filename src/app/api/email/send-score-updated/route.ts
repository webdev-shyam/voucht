import { NextResponse } from "next/server";
import { sendScoreUpdatedEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      name,
      username,
      oldScore,
      newScore,
      deliveryRate = 96,
      onTimeRate = 92,
      ghostRate = 0,
    } = body;

    if (!to || typeof newScore !== "number") {
      return NextResponse.json(
        { error: "Missing required fields (to, newScore)" },
        { status: 400 }
      );
    }

    const result = await sendScoreUpdatedEmail({
      to,
      name: name || "Creator",
      username: username || "profile",
      oldScore: typeof oldScore === "number" ? oldScore : newScore - 2,
      newScore,
      deliveryRate,
      onTimeRate,
      ghostRate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("send-score-updated error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch score update notification" },
      { status: 500 }
    );
  }
}
