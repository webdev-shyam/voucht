import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/constants";

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            Transparent pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Start free. Upgrade when proof helps you win work.
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8] mb-2">
            Every plan is billed monthly in 30-day periods. Nothing here is a
            feature preview &mdash; the lists below describe what the product
            does today.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs text-[#a0a0b8]">
            <span>
              Create a free account first; upgrade any time from your dashboard
              when a feature is locked.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => (
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
                <h3 className="text-xl font-bold text-white tracking-wide mb-3">
                  {plan.name}
                </h3>

                <p className="text-xs sm:text-sm text-[#a0a0b8] min-h-[40px] mb-6">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1.5 mb-8 pb-6 border-b border-white/10">
                  <span className="text-5xl font-extrabold text-white font-mono">
                    ${plan.price}
                  </span>
                  <span className="text-sm font-medium text-[#a0a0b8]">
                    {plan.interval === "forever" ? "forever" : "/mo, billed monthly"}
                  </span>
                </div>

                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-slate-200"
                    >
                      <Check className="w-4 h-4 text-[#00ff88] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                asChild
                size="lg"
                variant={plan.popular ? "electric" : "outline"}
                className="w-full h-12 text-sm font-semibold justify-center"
              >
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
