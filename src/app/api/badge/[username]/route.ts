import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { badgeFor } from "@/lib/trust-score";
import type { BadgeTier } from "@/lib/types";

const USERNAME_RE = /^[a-z0-9_-]{3,32}$/;

// `middle`/`right` are plain text; the score value is passed separately so the
// highlighted number and the aria-label can both be built from clean strings.
function renderSvg(
  label: string,
  middle: string,
  right: string,
  color: string,
  scoreValue?: string
): string {
  const middleText = scoreValue
    ? `${middle}<tspan fill="${color}" font-weight="800" font-family="'SF Mono', Monaco, Consolas, monospace">${scoreValue}</tspan>`
    : middle;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="50" viewBox="0 0 250 50" fill="none" role="img" aria-label="${label}, ${middle} ${scoreValue ?? ""}, ${right}">
  <rect x="0.5" y="0.5" width="249" height="49" rx="8" fill="#1a1a2e" stroke="${color}" stroke-width="1"/>
  <g transform="translate(12, 17)">
    <path d="M2 8L6 12L14 3" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="32" y="30" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="700">${label}</text>
  <line x1="126" y1="14" x2="126" y2="36" stroke="#2e3048"/>
  <text x="134" y="30" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="500">${middleText}</text>
  <line x1="192" y1="14" x2="192" y2="36" stroke="#2e3048"/>
  <text x="199" y="30" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="600">${right}</text>
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username?.toLowerCase() ?? "";

  const svgHeaders = {
    "Content-Type": "image/svg+xml",
    // Short enough that a fresh confirmation shows up quickly, long enough for
    // a badge on a busy README not to hit the database on every page view.
    "Cache-Control": "public, max-age=300, s-maxage=600",
  };

  if (!USERNAME_RE.test(username) || !isSupabaseConfigured()) {
    return new NextResponse(
      renderSvg("Voucht", "unverified", "no data", "#a0a0b8"),
      { headers: svgHeaders }
    );
  }

  const supabase = createAdminClient();

  // The badge is a public projection: it may only read columns the
  // public_profiles view exposes, never the underlying profile row.
  const { data } = await supabase
    .from("public_profiles")
    .select("trust_score, completed_projects, badge_tier")
    .eq("username", username)
    .maybeSingle();

  if (!data) {
    return new NextResponse(
      renderSvg("Voucht", "not found", "@handle", "#a0a0b8"),
      { headers: svgHeaders }
    );
  }

  const completed = Number(data.completed_projects ?? 0);
  const score = data.trust_score === null ? null : Number(data.trust_score);

  // No client-confirmed delivery yet is a real state, not a score of zero and
  // not an invented 94.
  if (score === null || Number.isNaN(score)) {
    return new NextResponse(
      renderSvg("Voucht", "awaiting first", "verification", "#a0a0b8"),
      { headers: svgHeaders }
    );
  }

  const tier = badgeFor((data.badge_tier ?? "none") as BadgeTier);

  return new NextResponse(
    renderSvg(
      "Voucht verified",
      "Score: ",
      `${completed} ${completed === 1 ? "job" : "jobs"}`,
      tier.color,
      String(Math.round(score))
    ),
    { headers: svgHeaders }
  );
}
