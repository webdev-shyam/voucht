import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// In-memory rate limiter: max 5 requests per 60 seconds per IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Check IP rate limit
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many verification requests. Please wait a minute before retrying." },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    const { token, action = "confirm", feedback = "", rating = 5 } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        mocked: true,
        action,
        message: action === "confirm" ? "Confirmed successfully (local mode)" : "Reported issue (local mode)",
      });
    }

    const supabase: any = createAdminClient();
    const now = new Date().toISOString();

    // 1. Check if token is for a delivery
    const { data: delivery } = await supabase
      .from("deliveries")
      .select("id, project_id, milestone_id, freelancer_id, client_confirmed")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (delivery) {
      if (delivery.client_confirmed && action === "confirm") {
        return NextResponse.json({
          success: true,
          alreadyConfirmed: true,
          message: "Delivery already confirmed",
        });
      }

      if (action === "confirm") {
        await supabase
          .from("deliveries")
          .update({
            client_confirmed: true,
            client_confirmed_at: now,
          })
          .eq("id", delivery.id);

        if (delivery.milestone_id) {
          await supabase
            .from("milestones")
            .update({
              status: "confirmed",
              client_confirmed_at: now,
            })
            .eq("id", delivery.milestone_id);
        }

        // Trigger trust score recalculation
        try {
          await supabase.rpc("recalculate_trust_score", {
            p_freelancer_id: delivery.freelancer_id,
          });
        } catch {
          // Ignore if RPC not loaded
        }

        // Log activity
        await supabase.from("activity_log").insert({
          user_id: delivery.freelancer_id,
          event_type: "milestone_confirmed",
          title: "Milestone Verified by Client",
          description: `Client approved delivery via secure confirmation link.`,
          project_id: delivery.project_id,
        });

        return NextResponse.json({
          success: true,
          action: "confirmed",
        });
      } else {
        // Disputed or issue reported
        if (delivery.milestone_id) {
          await supabase
            .from("milestones")
            .update({
              status: "disputed",
              notes: feedback,
            })
            .eq("id", delivery.milestone_id);
        }

        await supabase.from("activity_log").insert({
          user_id: delivery.freelancer_id,
          event_type: "delivery_failed",
          title: "Client Reported Milestone Issue",
          description: feedback || "Client indicated delivery has not been received.",
          project_id: delivery.project_id,
        });

        return NextResponse.json({
          success: true,
          action: "disputed",
        });
      }
    }

    // 2. Check if token matches project-level client_token
    const { data: project } = await supabase
      .from("projects")
      .select("id, freelancer_id, client_token, client_confirmed")
      .eq("client_token", token)
      .maybeSingle();

    if (project) {
      if (project.client_confirmed && action === "confirm") {
        return NextResponse.json({
          success: true,
          alreadyConfirmed: true,
          message: "Project already confirmed",
        });
      }

      if (action === "confirm") {
        await supabase
          .from("projects")
          .update({
            client_confirmed: true,
            client_confirmed_at: now,
          })
          .eq("id", project.id);

        try {
          await supabase.rpc("recalculate_trust_score", {
            p_freelancer_id: project.freelancer_id,
          });
        } catch {
          // Ignore
        }

        await supabase.from("activity_log").insert({
          user_id: project.freelancer_id,
          event_type: "project_completed",
          title: "Client Confirmed Project Scope",
          description: "Client signed off on project terms.",
          project_id: project.id,
        });

        return NextResponse.json({
          success: true,
          action: "confirmed",
          type: "project",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Processed token with fallback handler",
    });
  } catch (error) {
    console.error("verify route error:", error);
    return NextResponse.json({ error: "Failed to verify token" }, { status: 500 });
  }
}
