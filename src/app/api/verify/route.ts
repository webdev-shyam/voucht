import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// In-memory rate limiter: max 5 writes per 60 seconds per IP. The window is
// deliberately small — a confirmation link is a single-use, low-frequency action.
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

  if (record.count >= maxRequests) return true;

  record.count += 1;
  return false;
}

const bodySchema = z.object({
  token: z.string().uuid(),
  action: z.enum(["confirm", "dispute"]),
  reason: z.string().trim().max(500).optional(),
});

// record_verification() is SECURITY DEFINER and owns the whole transaction:
// it locks the delivery, writes the milestone/project state, recalculates the
// trust score and appends the activity log. This route must not duplicate any
// of that, or an unverified client action could reach the database.
export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait a minute before retrying." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      // An unknown or malformed token is reported as invalid without revealing
      // whether it exists.
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "The verification service is unavailable right now. Please try again later." },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("record_verification", {
      p_token: parsed.data.token,
      p_action: parsed.data.action,
      p_reason: parsed.data.reason ?? null,
    });

    if (error) {
      console.error("record_verification failed:", error.message);
      return NextResponse.json(
        { error: "We could not record your response. Please try again." },
        { status: 502 }
      );
    }

    const result = (data ?? {}) as {
      success?: boolean;
      reason?: string;
      status?: "confirmed" | "disputed";
    };

    if (!result.success) {
      // reason is 'invalid' | 'expired' | 'confirmed' | 'disputed' | 'cancelled'
      return NextResponse.json({ success: false, reason: result.reason ?? "invalid" });
    }

    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    console.error("verify route error:", error);
    return NextResponse.json(
      { error: "We could not record your response. Please try again." },
      { status: 500 }
    );
  }
}
