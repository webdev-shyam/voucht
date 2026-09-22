import { useAppStore } from "@/store/useAppStore";
import { PRICING_PLANS } from "@/lib/constants";
import { SubscriptionTier } from "@/lib/types";

export function useSubscription() {
  const user = useAppStore((state) => state.user);
  const setSubscriptionTier = useAppStore((state) => state.setSubscriptionTier);

  const currentTier = user.tier;
  const currentPlan = PRICING_PLANS.find((p) => p.id === currentTier) || PRICING_PLANS[0];

  const upgradeTo = (tier: SubscriptionTier) => {
    setSubscriptionTier(tier);
  };

  const isPro = currentTier === "pro" || currentTier === "agency";
  const isAgency = currentTier === "agency";

  return {
    tier: currentTier,
    plan: currentPlan,
    isPro,
    isAgency,
    upgradeTo,
  };
}
