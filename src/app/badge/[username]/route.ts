import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username?.toLowerCase() || "alexrivera";

  let trustScore = 94;
  let completedProjects = 23;

  if (isSupabaseConfigured()) {
    try {
      const supabase: any = createAdminClient();
      const res = await supabase
        .from("profiles")
        .select("trust_score, completed_projects")
        .eq("username", username)
        .maybeSingle();

      const data = res?.data as any;
      if (data) {
        if (typeof data.trust_score === "number") trustScore = data.trust_score;
        if (typeof data.completed_projects === "number") completedProjects = data.completed_projects;
      }
    } catch {
      // Use fallback defaults
    }
  }

  // Exactly matching requested spec:
  // 250x50px, Background: #1a1a2e, Border: 1px #00ff88, Checkmark: #00ff88, Text: white, clean font
  // ┌──────────────────────────────────────────┐
  // │  ✓ Voucht Verified │ Score: 94 │ 23 jobs │
  // └──────────────────────────────────────────┘
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="50" viewBox="0 0 250 50" fill="none">
  <!-- Background & Border -->
  <rect x="0.5" y="0.5" width="249" height="49" rx="8" fill="#1a1a2e" stroke="#00ff88" stroke-width="1"/>

  <!-- Verified Checkmark Icon -->
  <g transform="translate(12, 17)">
    <path d="M2 8L6 12L14 3" stroke="#00ff88" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Left: Voucht Verified -->
  <text x="32" y="30" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="-0.2px">
    Voucht Verified
  </text>

  <!-- Divider 1 -->
  <line x1="126" y1="14" x2="126" y2="36" stroke="#2e3048" stroke-width="1"/>

  <!-- Middle: Score: 94 -->
  <text x="134" y="30" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="500">
    Score: <tspan fill="#00ff88" font-weight="800" font-family="'SF Mono', Monaco, Consolas, monospace">${trustScore}</tspan>
  </text>

  <!-- Divider 2 -->
  <line x1="192" y1="14" x2="192" y2="36" stroke="#2e3048" stroke-width="1"/>

  <!-- Right: 23 jobs -->
  <text x="199" y="30" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="600">
    ${completedProjects} jobs
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
