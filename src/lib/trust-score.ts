import type { BadgeTier } from "./types";

// The Trust Score is calculated in one place: the recalculate_trust_score()
// function in supabase/migrations. Nothing in this file may compute a score.
// What lives here is the label and explanation shown next to the stored number.

export const TRUST_SCORE_WEIGHTS = [
  {
    key: "deliveryRate",
    label: "Completed projects",
    weight: 40,
    detail: "Projects you finished and archived, out of all projects recorded.",
  },
  {
    key: "onTimeRate",
    label: "On-time, client-confirmed deliveries",
    weight: 25,
    detail:
      "Share of confirmed deliveries submitted by or before their deadline, with a 24 hour grace window.",
  },
  {
    key: "reliability",
    label: "No cancelled work",
    weight: 20,
    detail: "Projects you cancelled reduce this portion of the score.",
  },
  {
    key: "consistency",
    label: "Track record volume",
    weight: 15,
    detail: "Up to 1.5 points per completed project, capped at 15 points.",
  },
] as const;

export const BADGE_TIERS: Record<
  BadgeTier,
  { label: string; color: string; requirement: string }
> = {
  none: {
    label: "Not yet verified",
    color: "#a0a0b8",
    requirement: "No client-confirmed delivery yet.",
  },
  building: {
    label: "Building track record",
    color: "#38bdf8",
    requirement: "At least one client-confirmed delivery.",
  },
  reliable: {
    label: "Reliable",
    color: "#22c55e",
    requirement: "Score of 60 or higher with 2 or more completed projects.",
  },
  exceptional: {
    label: "Highly reliable",
    color: "#00ff88",
    requirement: "Score of 80 or higher with 3 or more completed projects.",
  },
};

export function badgeFor(tier: BadgeTier) {
  return BADGE_TIERS[tier] ?? BADGE_TIERS.none;
}

// A null score is an honest state, not a zero. Every surface that shows the
// number goes through this so "no history" can never render as "0/100".
export function formatTrustScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "—";
  return String(Math.round(score));
}

export const NO_HISTORY_MESSAGE = "No verified work history yet.";
