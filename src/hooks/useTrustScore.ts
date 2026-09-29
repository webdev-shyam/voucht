import { useAppStore } from "@/store/useAppStore";
import { BADGE_TIERS, NO_HISTORY_MESSAGE, badgeFor, formatTrustScore } from "@/lib/trust-score";

// Reads the score the database calculated. There is no client-side fallback
// value: a freelancer with no confirmed delivery has `score === null`, and the
// UI shows NO_HISTORY_MESSAGE instead of a number.
export function useTrustScore() {
  const user = useAppStore((state) => state.user);

  const score = user?.trustScore ?? null;
  const tier = user?.badgeTier ?? "none";
  const badge = BADGE_TIERS[tier] ?? BADGE_TIERS.none;

  return {
    score,
    tier,
    badge,
    badgeInfo: badgeFor(tier),
    display: formatTrustScore(score),
    hasHistory: score !== null,
    emptyMessage: NO_HISTORY_MESSAGE,
    completedProjects: user?.completedProjects ?? 0,
    onTimeRate: user?.onTimeRate ?? null,
    ghostRate: user?.ghostRate ?? null,
    totalProjects: user?.totalProjects ?? 0,
  };
}
