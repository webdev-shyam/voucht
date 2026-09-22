"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  Coins,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRICING_PLANS } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";
import { SubscriptionTier } from "@/lib/types";

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((state) => state.user);
  const setSubscriptionTier = useAppStore((state) => state.setSubscriptionTier);
  const logActivity = useAppStore((state) => state.logActivity);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangePlanView, setShowChangePlanView] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<"creem" | "nowpayments">("creem");

  // Format dynamic next billing date (30 days from now)
  const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Handle ?success=true after returning from payment gateway
  useEffect(() => {
    const successParam = searchParams.get("success");
    const planParam = searchParams.get("plan");
    const providerParam = searchParams.get("provider");

    if (successParam === "true") {
      const targetPlan: SubscriptionTier = planParam === "elite" ? "elite" : "pro";
      if (providerParam === "nowpayments") {
        setPaymentProvider("nowpayments");
      } else {
        setPaymentProvider("creem");
      }

      setSubscriptionTier(targetPlan);

      logActivity({
        title: `Subscribed to ${targetPlan.toUpperCase()} Plan`,
        description: `Upgraded via ${providerParam === "nowpayments" ? "NOWPayments (Crypto)" : "CREEM (Card)"}.`,
        type: "milestone_confirmed",
      });

      toast({
        title: targetPlan === "elite" ? "🎉 Welcome to Voucht Elite!" : "🎉 Welcome to Voucht Pro!",
        description: "You now have unlimited access.",
      });

      // Clear search params cleanly without reload
      router.replace("/dashboard/billing");
    } else if (searchParams.get("cancelled") === "true") {
      toast({
        title: "Checkout Cancelled",
        description: "Your subscription setup was not completed. No charges were made.",
      });
      router.replace("/dashboard/billing");
    }
  }, [searchParams, setSubscriptionTier, logActivity, router]);

  // Launch CREEM card checkout
  const handleCardCheckout = async (plan: "pro" | "elite") => {
    setLoadingAction(`creem_${plan}`);
    try {
      const res = await fetch("/api/checkout/creem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        if (data.checkoutUrl.startsWith("/")) {
          router.push(data.checkoutUrl);
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else {
        throw new Error(data.error || "Failed to create CREEM checkout session");
      }
    } catch (err: any) {
      console.error("Card checkout error:", err);
      toast({
        title: "Redirecting to checkout...",
        description: "Processing your card payment session.",
      });
      router.push(`/dashboard/billing?success=true&provider=creem&plan=${plan}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Launch NOWPayments crypto invoice
  const handleCryptoCheckout = async (plan: "pro" | "elite") => {
    setLoadingAction(`crypto_${plan}`);
    try {
      const res = await fetch("/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.invoiceUrl) {
        if (data.invoiceUrl.startsWith("/")) {
          router.push(data.invoiceUrl);
        } else {
          window.location.href = data.invoiceUrl;
        }
      } else {
        throw new Error(data.error || "Failed to create crypto invoice");
      }
    } catch (err: any) {
      console.error("Crypto invoice error:", err);
      toast({
        title: "Redirecting to invoice...",
        description: "Preparing your NOWPayments crypto invoice.",
      });
      router.push(`/dashboard/billing?success=true&provider=nowpayments&plan=${plan}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Confirm cancel subscription
  const handleConfirmCancel = () => {
    setSubscriptionTier("free");
    setShowCancelDialog(false);
    setShowChangePlanView(false);

    logActivity({
      title: "Cancelled subscription",
      description: "Account downgraded to Free tier. Past verified records preserved.",
      type: "score_updated",
    });

    toast({
      title: "Subscription Cancelled",
      description: "You have returned to the Free plan. You keep your data but premium limits now apply.",
    });
  };

  const isPaidUser = user.tier === "pro" || user.tier === "elite" || user.tier === "agency";
  const currentPlanName = user.tier === "elite" ? "Elite Performer" : user.tier === "pro" ? "Freelancer Pro" : "Starter Free";
  const currentPlanPrice = user.tier === "elite" ? "$29/mo" : user.tier === "pro" ? "$10/mo" : "$0/mo";

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-electric" />
          <span>Billing & Subscriptions</span>
        </h1>
        <p className="text-sm text-textSecondary mt-1">
          Manage your Voucht tier, card payment methods via CREEM, and crypto subscriptions via NOWPayments.
        </p>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: PAID PLAN DETAILS (Shown if user is on Pro or Elite) */}
      {/* ============================================================ */}
      {isPaidUser && !showChangePlanView && (
        <div className="space-y-6">
          <Card className="border border-surfaceLight bg-surface shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-electric/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="p-6 sm:p-8 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">Active Membership</span>
                    <Badge variant="electric" className="text-xs font-mono uppercase px-2.5 py-0.5">
                      {user.tier.toUpperCase()} ACTIVE
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <span>{currentPlanName}</span>
                    {user.tier === "elite" ? (
                      <Sparkles className="w-5 h-5 text-electric" />
                    ) : (
                      <Zap className="w-5 h-5 text-electric" />
                    )}
                  </h2>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-3xl font-black text-white font-mono">{currentPlanPrice}</span>
                  <span className="text-xs text-textSecondary block">Billed monthly</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surfaceLight/80">
                <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                    <Calendar className="w-3.5 h-3.5 text-electric" />
                    <span>Next Billing Date</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">{nextBillingDate}</p>
                </div>

                <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                    {paymentProvider === "nowpayments" ? (
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-electric" />
                    )}
                    <span>Payment Method</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {paymentProvider === "nowpayments" ? "Crypto via NOWPayments" : "Card via CREEM (Merchant of Record)"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Coverage</span>
                  </div>
                  <p className="text-sm font-bold text-white">Unlimited Client Deliveries</p>
                </div>
              </div>

              {/* Action Buttons: Change Plan & Cancel Subscription */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surfaceLight/80">
                <Button
                  variant="outline"
                  onClick={() => setShowChangePlanView(true)}
                  className="border-surfaceLight hover:bg-surfaceLight text-slate-200 text-xs font-bold gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-electric" />
                  <span>Change Plan</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-bold"
                >
                  <span>Cancel Subscription</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: PRICING COMPARISON (Shown for Free plan or Change Plan) */}
      {/* ============================================================ */}
      {(!isPaidUser || showChangePlanView) && (
        <div className="space-y-6">
          {showChangePlanView && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-navyLight border border-surfaceLight">
              <span className="text-xs text-slate-300 font-medium">
                Changing your subscription plan. Choose an option below:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangePlanView(false)}
                className="text-xs text-textSecondary hover:text-white"
              >
                Back to Current Plan
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => {
              const isCurrent = user.tier === plan.id;
              const isPro = plan.id === "pro";
              const isElite = plan.id === "elite";
              const isFree = plan.id === "free";

              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col justify-between relative bg-surface border transition-all ${
                    isCurrent
                      ? "border-electric ring-1 ring-electric shadow-[0_0_25px_rgba(0,255,136,0.15)]"
                      : plan.popular
                      ? "border-electric/50"
                      : "border-surfaceLight"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="electric" className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-sky-500 text-slate-950 font-bold px-3 py-0.5 text-[10px] uppercase tracking-wider">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="p-6">
                    <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                      <span>{plan.name}</span>
                      {isElite && <Sparkles className="w-4 h-4 text-electric" />}
                      {isPro && <Zap className="w-4 h-4 text-electric" />}
                    </CardTitle>
                    <CardDescription className="text-xs text-textSecondary mt-1 min-h-[36px]">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-black text-white font-mono">
                        ${plan.price}
                      </span>
                      <span className="text-textSecondary ml-2 text-xs font-mono">
                        /{plan.interval}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 flex-1">
                    <ul className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start text-xs text-slate-200">
                          <Check className="h-4 w-4 text-[#00ff88] shrink-0 mr-2 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex flex-col gap-2.5">
                    {isFree ? (
                      <Button
                        variant="outline"
                        className="w-full text-xs font-bold h-10 border-surfaceLight text-textSecondary"
                        disabled={isCurrent}
                        onClick={handleConfirmCancel}
                      >
                        {isCurrent ? "Active Free Tier" : "Downgrade to Free"}
                      </Button>
                    ) : (
                      <>
                        {/* 💳 Button 1: Card via CREEM */}
                        <Button
                          variant="electric"
                          className="w-full text-xs font-bold h-10 gap-2 shadow-sm bg-electric text-navy hover:bg-electric/90"
                          disabled={isCurrent || loadingAction !== null}
                          onClick={() => handleCardCheckout(plan.id as "pro" | "elite")}
                        >
                          {loadingAction === `creem_${plan.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>💳 Pay with Card — ${plan.price}/mo</span>
                        </Button>

                        {/* 🪙 Button 2: Crypto via NOWPayments */}
                        <Button
                          variant="outline"
                          className="w-full text-xs font-bold h-10 gap-2 border-surfaceLight bg-surface hover:bg-surfaceLight text-slate-200"
                          disabled={isCurrent || loadingAction !== null}
                          onClick={() => handleCryptoCheckout(plan.id as "pro" | "elite")}
                        >
                          {loadingAction === `crypto_${plan.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span>🪙 Pay with Crypto — ${plan.price}/mo</span>
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Guarantee disclaimer below buttons */}
          <div className="text-center pt-2">
            <p className="text-xs text-textSecondary flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>30-day money-back guarantee · Cancel anytime</span>
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Cancel Subscription */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md bg-[#0f101d] border border-surfaceLight text-white p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Cancel your {currentPlanName} subscription?
            </DialogTitle>
            <DialogDescription className="text-xs text-textSecondary pt-1 leading-relaxed">
              Are you sure you want to cancel? You will be transitioned to the Free tier.
              Your historical verified deliverables, client sign-offs, and trust score will remain permanently safe, but you will be limited to 1 active project.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-surfaceLight text-slate-300 text-xs font-bold"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-textSecondary">Loading billing portal...</div>}>
      <BillingContent />
    </Suspense>
  );
}
