import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { APP_URL } from "@/lib/constants";

const USERNAME_RE = /^[a-z0-9_-]{3,32}$/;

const bodySchema = z.object({
  username: z.string().regex(USERNAME_RE),
});

// The visitor IP is never stored. It is hashed with a key that rotates daily,
// so profile_views cannot be used to rebuild a visitor's browsing history.
function viewerHash(ip: string): string {
  const salt = process.env.PROFILE_VIEW_HASH_SECRET;
  const key = `${salt || "voucht-profile-view"}-${new Date().toISOString().slice(0, 10)}`;
  return crypto.createHmac("sha256", key).update(ip).digest("hex").slice(0, 32);
}

interface VisitOrigin {
  referrerDomain: string | null;
  source: "direct" | "internal" | "external";
}

function visitOrigin(referrer: string | null): VisitOrigin {
  if (!referrer) return { referrerDomain: null, source: "direct" };

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const ownHost = new URL(APP_URL).hostname.toLowerCase();
    return { referrerDomain: host, source: host === ownHost ? "internal" : "external" };
  } catch {
    return { referrerDomain: null, source: "direct" };
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ recorded: false }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const hash = viewerHash(ip);
  const origin = visitOrigin(request.headers.get("referer"));

  try {
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("public_profiles")
      .select("id")
      .eq("username", parsed.data.username)
      .maybeSingle();

    if (!profile) return NextResponse.json({ recorded: false });

    // Count a viewer once per day per profile.
    const { data: recent } = await supabase
      .from("profile_views")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("viewer_hash", hash)
      .gte("viewed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recent) return NextResponse.json({ recorded: false, deduplicated: true });

    await supabase.from("profile_views").insert({
      profile_id: profile.id,
      viewer_hash: hash,
      referrer_domain: origin.referrerDomain,
      source: origin.source,
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    // Telemetry must never break a page view.
    console.error("profile-view telemetry error:", error);
    return NextResponse.json({ recorded: false });
  }
}
