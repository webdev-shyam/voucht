import { useAppStore } from "@/store/useAppStore";
import { getTierForScore } from "@/lib/trust-score";

export function useTrustScore() {
  const trustFactors = useAppStore((state) => state.trustFactors);
  const score = trustFactors.overallScore;
  const tier = getTierForScore(score);

  return {
    score,
    tier,
    factors: trustFactors,
    badges: trustFactors.badges,
  };
}
