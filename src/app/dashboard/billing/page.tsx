"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  Coins,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
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
import { PRICING_PLANS, SUPPORT_EMAIL } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

type PaidPlanId = "pro" | "elite";

interface ProviderAvailability {
  creem: { pro: boolean; elite: boolean };
  nowpayments: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((state) => state.user);
  const subscription = useAppStore((state) => state.subscription);
  const load = useAppStore((state) => state.load);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangePlanView, setShowChangePlanView] = useState(false);
  const [availability, setAvailability] = useState<ProviderAvailability | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const pendingProvider =
    searchParams.get("pending") === "true" ? searchParams.get("provider") : null;

  useEffect(() => {
    let cancelled = false;
    // Availability is decided by server-side configuration, never by a hardcoded
    // list, so the screen can say "not set up" instead of faking a checkout.
    void fetch("/api/checkout/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setAvailability(data as ProviderAvailability);
      })
      .catch(() => {
        if (!cancelled) setAvailability({ creem: { pro: false, elite: false }, nowpayments: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Coming back from a provider means the payment may still be propagating.
  // Re-read the account rather than declaring success from the redirect.
  useEffect(() => {
    if (!pendingProvider) return;
    void load();
    const timer = setTimeout(() => void load(), 4000);
    return () => clearTimeout(timer);
  }, [pendingProvider, load]);

  const startCheckout = useCallback(
    async (provider: "creem" | "nowpayments", plan: PaidPlanId) => {
      setLoadingAction(`${provider}_${plan}`);
      setCheckoutError(null);

      try {
        const res = await fetch(`/api/checkout/${provider}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.ok && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        setCheckoutError(
          data?.error ??
            (data?.reason === "not-configured"
              ? provider === "creem"
                ? "Card payments are not available yet."
                : "Crypto payments are not available yet."
              : "We could not start the checkout. Please try again.")
        );
      } catch {
        setCheckoutError("Network error. Please check your connection and try again.");
      } finally {
        setLoadingAction(null);
      }
    },
    []
  );

  if (!user) {
    return (
      <div className="p-8 text-center text-sm text-textSecondary">
        Loading your billing information...
      </div>
    );
  }

  const isPaidUser = user.tier === "pro" || user.tier === "elite";
  const planName = user.tier === "elite" ? "Elite" : user.tier === "pro" ? "Pro" : "Free";
  const providerLabel =
    subscription?.provider === "nowpayments"
      ? "Crypto via NOWPayments"
      : subscription?.provider === "creem"
        ? "Card via CREEM"
        : null;

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-electric" />
          <span>Billing & Subscriptions</span>
        </h1>
        <p className="text-sm text-textSecondary mt-1">
          Card payments run through CREEM; crypto payments through NOWPayments. Your plan is set by
          the payment provider&apos;s confirmation, not by this page.
        </p>
      </div>

      {pendingProvider ? (
        <div className="p-4 rounded-xl border border-electric/30 bg-electric/5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Returning from {pendingProvider === "creem" ? "CREEM" : "NOWPayments"}</p>
            <p className="text-xs text-textSecondary mt-1">
              {subscription?.status === "active" && user.tier !== "free"
                ? `Your ${planName} plan is active.`
                : "We are waiting for the provider to confirm the payment. This normally takes a few seconds, and longer for crypto network confirmations."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-surfaceLight text-xs gap-1.5 shrink-0"
            onClick={() => void load()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check status</span>
          </Button>
        </div>
      ) : null}

      {isPaidUser && !showChangePlanView ? (
        <Card className="border border-surfaceLight bg-surface shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-electric/5 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="p-6 sm:p-8 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                    Active plan
                  </span>
                  <Badge variant="electric" className="text-xs font-mono uppercase px-2.5 py-0.5">
                    {user.tier}
                  </Badge>
                </div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{planName}</span>
                  {user.tier === "elite" ? (
                    <Sparkles className="w-5 h-5 text-electric" />
                  ) : (
                    <Zap className="w-5 h-5 text-electric" />
                  )}
                </h2>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-3xl font-black text-white font-mono">
                  ${PRICING_PLANS.find((p) => p.id === user.tier)?.price ?? 0}
                </span>
                <span className="text-xs text-textSecondary block">per month</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surfaceLight/80">
              <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                  <Calendar className="w-3.5 h-3.5 text-electric" />
                  <span>{subscription?.status === "cancelled" ? "Access until" : "Renews on"}</span>
                </div>
                <p className="text-sm font-bold text-white font-mono">
                  {formatDate(subscription?.currentPeriodEnd ?? user.planExpiresAt ?? null)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                  {subscription?.provider === "nowpayments" ? (
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-electric" />
                  )}
                  <span>Payment method</span>
                </div>
                <p className="text-sm font-bold text-white">{providerLabel ?? "On file with the provider"}</p>
              </div>

              <div className="p-4 rounded-xl bg-navyLight/60 border border-surfaceLight space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status</span>
                </div>
                <p className="text-sm font-bold text-white capitalize">
                  {subscription?.status ?? "active"}
                </p>
              </div>
            </div>

            {subscription?.status === "cancelled" ? (
              <p className="text-xs text-amber-300">
                This subscription is cancelled. Premium features stay available until the paid
                period ends, then the account returns to Free.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surfaceLight/80">
              <Button
                variant="outline"
                onClick={() => setShowChangePlanView(true)}
                className="border-surfaceLight hover:bg-surfaceLight text-slate-200 text-xs font-bold gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-electric" />
                <span>Change plan</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowCancelDialog(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-bold"
              >
                <span>How do I cancel?</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {(!isPaidUser || showChangePlanView) ? (
        <div className="space-y-6">
          {showChangePlanView ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-navyLight border border-surfaceLight">
              <span className="text-xs text-slate-300 font-medium">
                Choose a plan. Changing plans creates a new checkout; your current plan stays active
                until its period ends.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangePlanView(false)}
                className="text-xs text-textSecondary hover:text-white"
              >
                Back to current plan
              </Button>
            </div>
          ) : null}

          {checkoutError ? (
            <p className="text-xs text-red-400 font-medium">{checkoutError}</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => {
              const isCurrent = user.tier === plan.id;
              const cardUnavailable =
                availability?.creem?.[plan.id as PaidPlanId] === false;

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
                  {isCurrent ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="electric" className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Current plan
                      </Badge>
                    </div>
                  ) : null}

                  {plan.popular && !isCurrent ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-sky-500 text-slate-950 font-bold px-3 py-0.5 text-[10px] uppercase tracking-wider">
                        Most popular
                      </Badge>
                    </div>
                  ) : null}

                  <CardHeader className="p-6">
                    <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                      <span>{plan.name}</span>
                      {plan.id === "elite" ? <Sparkles className="w-4 h-4 text-electric" /> : null}
                      {plan.id === "pro" ? <Zap className="w-4 h-4 text-electric" /> : null}
                    </CardTitle>
                    <CardDescription className="text-xs text-textSecondary mt-1 min-h-[36px]">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-black text-white font-mono">${plan.price}</span>
                      <span className="text-textSecondary ml-2 text-xs font-mono">/{plan.interval}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 flex-1">
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start text-xs text-slate-200">
                          <Check className="h-4 w-4 text-[#00ff88] shrink-0 mr-2 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex flex-col gap-2.5">
                    {plan.id === "free" ? (
                      <Button
                        variant="outline"
                        className="w-full text-xs font-bold h-10 border-surfaceLight text-textSecondary"
                        disabled
                      >
                        {isCurrent ? "Your current plan" : "Free tier is automatic"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="electric"
                          className="w-full text-xs font-bold h-10 gap-2 shadow-sm bg-electric text-navy hover:bg-electric/90"
                          disabled={
                            isCurrent || loadingAction !== null || cardUnavailable
                          }
                          onClick={() => void startCheckout("creem", plan.id as PaidPlanId)}
                        >
                          {loadingAction === `creem_${plan.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {cardUnavailable
                              ? "Card checkout unavailable"
                              : `Pay with card — $${plan.price}/mo`}
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full text-xs font-bold h-10 gap-2 border-surfaceLight bg-surface hover:bg-surfaceLight text-slate-200"
                          disabled={
                            isCurrent ||
                            loadingAction !== null ||
                            availability?.nowpayments === false
                          }
                          onClick={() => void startCheckout("nowpayments", plan.id as PaidPlanId)}
                        >
                          {loadingAction === `nowpayments_${plan.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span>
                            {availability?.nowpayments === false
                              ? "Crypto checkout unavailable"
                              : `Pay with crypto — $${plan.price}/mo`}
                          </span>
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-textSecondary flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Crypto plans are a fixed 30-day pass and simply expire. Card plans renew until you
                cancel with the provider.
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md bg-[#0f101d] border border-surfaceLight text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Cancelling a subscription
            </DialogTitle>
            <DialogDescription className="text-xs text-textSecondary pt-1 leading-relaxed">
              {subscription?.provider === "nowpayments" ? (
                <>
                  Crypto payments buy a 30-day pass and do not renew on their own. Nothing to
                  cancel — access ends on {formatDate(subscription?.currentPeriodEnd ?? null)} and
                  your account returns to Free.
                </>
              ) : (
                <>
                  Card subscriptions are managed by CREEM, our merchant of record. Cancelling stops
                  the next renewal and happens on their customer portal, not in Voucht. Verified
                  deliveries, client sign-offs and your Trust Score stay on your account either
                  way.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-surfaceLight text-slate-300 text-xs font-bold"
            >
              Close
            </Button>
            <Button
              variant="ghost"
              asChild
              className="text-xs font-bold text-electric hover:bg-electric/10"
            >
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Cancel%20my%20subscription`}>
                Contact support to cancel
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-sm text-textSecondary">Loading billing portal...</div>}
    >
      <BillingContent />
    </Suspense>
  );
}
