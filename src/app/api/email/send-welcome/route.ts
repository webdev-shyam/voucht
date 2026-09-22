import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, username } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing required email parameter: to" }, { status: 400 });
    }

    const result = await sendWelcomeEmail({
      to,
      name: name || "Creator",
      username: username || "profile",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("send-welcome error:", error);
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
  }
}
