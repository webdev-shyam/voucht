"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  Coins,
  Loader2,
  Sparkles,
  Zap,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  title?: string;
  description?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  title,
  description,
}: UpgradeModalProps) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "elite">("pro");
  const [loadingProvider, setLoadingProvider] = useState<"creem" | "nowpayments" | null>(null);

  const getFeatureHeading = () => {
    if (title) return title;
    if (feature === "unlimited_projects") return "Unlock Unlimited Projects";
    if (feature === "trust_badge") return "Unlock Your Dynamic SVG Trust Badge";
    if (feature === "smart_contracts") return "Unlock AI Smart Contracts";
    if (feature === "profile_analytics") return "Unlock Profile Views & Analytics";
    return "Upgrade to Voucht Pro or Elite";
  };

  const getFeatureSubtitle = () => {
    if (description) return description;
    if (feature === "unlimited_projects")
      return "Free plan allows 1 active project. Upgrade to manage unlimited concurrent clients and build your verified delivery history.";
    if (feature === "trust_badge")
      return "Embed a live, verified SVG badge into your GitHub README, portfolio, and website with dynamic trust score caching.";
    if (feature === "smart_contracts")
      return "Generate legally structured client service agreements with milestone sign-off clauses in seconds.";
    if (feature === "profile_analytics")
      return "Track which clients view your verified proof page, view referral traffic sources, and monitor engagement trends.";
    return "Scale your verifiable freelance reputation with unlimited projects, badges, and automated sign-offs.";
  };

  const handleCheckout = async (provider: "creem" | "nowpayments") => {
    setLoadingProvider(provider);

    try {
      const endpoint =
        provider === "creem" ? "/api/checkout/creem" : "/api/checkout/nowpayments";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      const redirectUrl = data.checkoutUrl || data.invoiceUrl;

      if (redirectUrl) {
        onOpenChange(false);
        if (redirectUrl.startsWith("/")) {
          router.push(redirectUrl);
        } else {
          window.location.href = redirectUrl;
        }
      } else {
        throw new Error(data.error || "Failed to initialize payment gateway.");
      }
    } catch (err: any) {
      console.error("Checkout launch error:", err);
      toast({
        title: "Checkout Notice",
        description: err.message || "Redirecting to billing portal...",
      });
      onOpenChange(false);
      router.push(`/dashboard/billing?success=true&provider=${provider}&plan=${selectedPlan}`);
    } finally {
      setLoadingProvider(null);
    }
  };

  const proPrice = 10;
  const elitePrice = 29;
  const activePrice = selectedPlan === "elite" ? elitePrice : proPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0f101d] border border-surfaceLight text-white p-0 overflow-hidden shadow-2xl">
        {/* Modal Top Banner */}
        <div className="relative p-6 pb-5 bg-gradient-to-b from-[#181a34] to-[#0f101d] border-b border-surfaceLight/60">
          <div className="flex items-center gap-2 text-electric text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Reputation & Limits Upgrade</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {getFeatureHeading()}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-textSecondary mt-1.5 leading-relaxed">
            {getFeatureSubtitle()}
          </DialogDescription>
        </div>

        {/* Plan Selector Switch */}
        <div className="p-6 pt-5 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Pro Plan Selector Card */}
            <div
              onClick={() => setSelectedPlan("pro")}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                selectedPlan === "pro"
                  ? "bg-electric/10 border-electric shadow-[0_0_20px_rgba(0,255,136,0.15)] ring-1 ring-electric"
                  : "bg-surface/50 border-surfaceLight hover:border-surfaceLight/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${selectedPlan === "pro" ? "text-electric" : "text-textSecondary"}`} />
                  <span className="font-bold text-sm text-white">Freelancer Pro</span>
                </div>
                <Badge variant="electric" className="text-[10px] uppercase font-bold py-0">
                  Most Popular
                </Badge>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-2xl font-black text-white font-mono">${proPrice}</span>
                <span className="text-xs text-textSecondary font-mono ml-1.5">/month</span>
              </div>
              <p className="text-[11px] text-textSecondary mt-1">
                Unlimited projects, SVG Trust Badges & AI Smart Contracts.
              </p>
            </div>

            {/* Elite Plan Selector Card */}
            <div
              onClick={() => setSelectedPlan("elite")}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                selectedPlan === "elite"
                  ? "bg-electric/10 border-electric shadow-[0_0_20px_rgba(0,255,136,0.15)] ring-1 ring-electric"
                  : "bg-surface/50 border-surfaceLight hover:border-surfaceLight/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`w-4 h-4 ${selectedPlan === "elite" ? "text-electric" : "text-textSecondary"}`} />
                  <span className="font-bold text-sm text-white">Elite Performer</span>
                </div>
                <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] uppercase font-bold py-0">
                  Full Suite
                </Badge>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-2xl font-black text-white font-mono">${elitePrice}</span>
                <span className="text-xs text-textSecondary font-mono ml-1.5">/month</span>
              </div>
              <p className="text-[11px] text-textSecondary mt-1">
                Profile analytics, dispute shielding & directory indexing.
              </p>
            </div>
          </div>

          {/* Feature Comparison List for Selected Tier */}
          <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-2.5 text-xs">
            <span className="text-[11px] font-bold text-textSecondary uppercase tracking-wider block mb-1">
              Included in {selectedPlan === "elite" ? "Elite Performer Tier" : "Freelancer Pro Tier"}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-electric shrink-0" />
                <span>Unlimited active client projects</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-electric shrink-0" />
                <span>Dynamic SVG Trust Badges</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-electric shrink-0" />
                <span>AI Smart Contracts with sign-offs</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-electric shrink-0" />
                <span>Automated milestone reminders</span>
              </div>
              {selectedPlan === "elite" && (
                <>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-electric shrink-0" />
                    <span>Profile views & visitor analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-electric shrink-0" />
                    <span>Dispute Shield & priority ledger</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TWO Payment Options (Card + Crypto) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-textSecondary px-1">
              <span>Select Payment Gateway</span>
              <span className="font-mono text-white font-bold">${activePrice}.00 USD / mo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Card via CREEM */}
              <Button
                variant="electric"
                className="w-full font-bold h-11 text-xs gap-2 shadow-md bg-electric text-navy hover:bg-electric/90"
                disabled={loadingProvider !== null}
                onClick={() => handleCheckout("creem")}
              >
                {loadingProvider === "creem" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 shrink-0" />
                )}
                <span>💳 Pay with Card — ${activePrice}/mo</span>
              </Button>

              {/* Option 2: Crypto via NOWPayments */}
              <Button
                variant="outline"
                className="w-full font-bold h-11 text-xs gap-2 border-surfaceLight bg-surface hover:bg-surfaceLight hover:text-white text-slate-200"
                disabled={loadingProvider !== null}
                onClick={() => handleCheckout("nowpayments")}
              >
                {loadingProvider === "nowpayments" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>🪙 Pay with Crypto — ${activePrice}/mo</span>
              </Button>
            </div>
          </div>

          {/* Guarantee banner */}
          <div className="text-center pt-1 pb-1">
            <p className="text-[11px] text-textSecondary flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>30-day money-back guarantee · Cancel anytime</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
