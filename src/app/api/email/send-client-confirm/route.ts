import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resend, sendMilestoneVerificationEmail } from "@/lib/email";

const bodySchema = z.object({
  deliveryId: z.string().uuid(),
});

// Per-delivery cooldown: an authenticated freelancer may ask us to email their
// own client, but they may not use Voucht as an unlimited send button.
const lastSentAt = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ sent: false, reason: "invalid-request" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ sent: false, reason: "not-configured" }, { status: 503 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ sent: false, reason: "signed-out" }, { status: 401 });
    }

    const cooldownKey = `${user.id}:${parsed.data.deliveryId}`;
    const previous = lastSentAt.get(cooldownKey);
    if (previous && Date.now() - previous < COOLDOWN_MS) {
      return NextResponse.json({ sent: false, reason: "too-soon" }, { status: 429 });
    }

    // The recipient, subject matter and link are all read back from the row the
    // caller owns — never taken from the request body. RLS limits the read to
    // this freelancer's deliveries; the explicit filter keeps that intent clear.
    const { data: delivery } = await supabase
      .from("deliveries")
      .select("*")
      .eq("id", parsed.data.deliveryId)
      .eq("freelancer_id", user.id)
      .maybeSingle();

    if (!delivery) {
      return NextResponse.json({ sent: false, reason: "not-found" }, { status: 404 });
    }

    if (delivery.verification_status !== "pending") {
      return NextResponse.json({ sent: false, reason: "already-answered" });
    }

    if (!delivery.confirmation_token || !delivery.client_email) {
      return NextResponse.json({ sent: false, reason: "missing-details" });
    }

    const [{ data: project }, { data: milestone }, { data: profile }] = await Promise.all([
      supabase
        .from("projects")
        .select("project_title")
        .eq("id", delivery.project_id)
        .maybeSingle(),
      delivery.milestone_id
        ? supabase.from("milestones").select("title").eq("id", delivery.milestone_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]);

    if (!resend) {
      // Configured production vs. unavailable provider: never report success.
      return NextResponse.json({ sent: false, reason: "email-not-configured" }, { status: 503 });
    }

    const result = await sendMilestoneVerificationEmail({
      to: delivery.client_email,
      clientName: delivery.client_name ?? "Client",
      freelancerName: profile?.full_name ?? "A freelancer",
      milestoneTitle: milestone?.title ?? project?.project_title ?? "Project milestone",
      projectTitle: project?.project_title ?? "Freelance project",
      token: delivery.confirmation_token,
    });

    if (!result?.sent) {
      return NextResponse.json({ sent: false, reason: result?.reason ?? "send-failed" }, { status: 502 });
    }

    lastSentAt.set(cooldownKey, Date.now());
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("send-client-confirm error:", error);
    return NextResponse.json({ sent: false, reason: "server-error" }, { status: 500 });
  }
}
