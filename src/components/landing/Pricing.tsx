"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      id: "free",
      name: "FREE",
      priceMonthly: 0,
      priceAnnual: 0,
      description: "Ideal for testing Voucht on your first real client delivery.",
      features: [
        "1 active project",
        "Basic Trust Score",
        "Public Proof Page",
        "Community support",
      ],
      cta: "Start Free →",
      popular: false,
      href: "/signup",
    },
    {
      id: "pro",
      name: "PRO",
      priceMonthly: 10,
      priceAnnual: 8,
      description: "For active freelancers who want full credibility & automated contracts.",
      features: [
        "Unlimited projects",
        "Full Trust Score with breakdown",
        "Trust Badge (embeddable)",
        "AI Smart Contracts (5/mo)",
        "Milestone auto-reminders",
        "Email notifications",
        "Priority support",
      ],
      cta: "Go Pro →",
      popular: true,
      href: "/signup?plan=pro",
    },
    {
      id: "elite",
      name: "ELITE",
      priceMonthly: 29,
      priceAnnual: 23,
      description: "For agencies & top consultants demanding deep intelligence and reach.",
      features: [
        "Everything in Pro",
        "Unlimited AI contracts",
        "Profile analytics (who viewed)",
        "Featured in Voucht Directory",
        "Client red-flag alerts",
        "Custom Proof Page URL",
      ],
      cta: "Go Elite →",
      popular: false,
      href: "/signup?plan=elite",
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            Transparent Investment
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Plans That Pay for Themselves
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8] mb-8">
            One extra closed contract pays for years of Voucht. Pick the plan that matches your pipeline.
          </p>

          {/* Centered toggle: Monthly / Annual (Save 20%) */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-[#1e1e3f] border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                !annual
                  ? "bg-[#00ff88] text-[#1a1a2e] shadow-md"
                  : "text-[#a0a0b8] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                annual
                  ? "bg-[#00ff88] text-[#1a1a2e] shadow-md"
                  : "text-[#a0a0b8] hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#1a1a2e] text-[#00ff88] text-[10px] font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? "bg-[#1e1e3f] border-2 border-[#00ff88] shadow-[0_0_40px_rgba(0,255,136,0.18)] lg:-translate-y-2"
                    : "bg-[#1e1e3f]/80 backdrop-blur-sm border border-white/10 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 rounded-full bg-[#00ff88] text-[#1a1a2e] text-xs font-black uppercase tracking-wider shadow-lg shadow-[#00ff88]/30">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white tracking-wide">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#a0a0b8] min-h-[40px] mb-6">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1.5 mb-8 pb-6 border-b border-white/10">
                    <span className="text-5xl font-extrabold text-white font-mono">
                      ${price}
                    </span>
                    <span className="text-sm font-medium text-[#a0a0b8]">
                      /mo {annual && price > 0 && <span className="text-xs text-[#00ff88]">(billed annually)</span>}
                    </span>
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                        <Check className="w-4 h-4 text-[#00ff88] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Button
                    asChild
                    size="lg"
                    variant={plan.popular ? "electric" : "outline"}
                    className="w-full h-12 text-sm font-semibold justify-center gap-1.5"
                  >
                    <Link href={plan.href}>
                      <span>{plan.cta}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
