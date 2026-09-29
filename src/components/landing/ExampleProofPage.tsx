"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Illustrative only: this is a drawing of what a proof page looks like, not a
// real freelancer, real client or real delivery record. It is labelled as such
// on the page and must stay that way.
const EXAMPLE_DELIVERIES = [
  {
    id: "e1",
    title: "Marketing site rebuild",
    clientLabel: "J***n D.",
    timingLabel: "3 days early",
    confirmedLabel: "Mar 2026",
  },
  {
    id: "e2",
    title: "Booking dashboard, phase 2",
    clientLabel: "P***a K.",
    timingLabel: "On time",
    confirmedLabel: "Feb 2026",
  },
  {
    id: "e3",
    title: "API integration & handover",
    clientLabel: "R***b S.",
    timingLabel: "On time",
    confirmedLabel: "Jan 2026",
  },
];

export function ExampleProofPage() {
  return (
    <section id="example-proof" className="py-24 bg-[#1a1a2e]/90 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00ff88]/5 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            What your proof page looks like
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            One link that proves you deliver
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            Put it in your proposal, your Upwork profile or your email signature. Every milestone on
            it was confirmed by the client who received it.
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-[#1a1a2e] shadow-2xl overflow-hidden relative">
          <div className="absolute -top-0 right-0 z-10">
            <Badge
              variant="outline"
              className="rounded-none rounded-bl-xl border-white/15 bg-black/60 text-[10px] uppercase tracking-wider text-[#a0a0b8] px-3 py-1"
            >
              Illustrative example
            </Badge>
          </div>

          <div className="px-4 py-3 bg-[#1e1e3f] border-b border-white/10 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 text-center">
              <span className="inline-block px-4 py-1 rounded-lg bg-black/30 border border-white/10 text-xs text-[#a0a0b8] font-mono">
                voucht.tech/profile/your-name
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-8 bg-[#1a1a2e] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#a0a0b8] font-mono">
                  Trust Score
                </p>
                <p className="text-4xl font-black text-white font-mono mt-1">
                  92<span className="text-lg text-[#a0a0b8]">/100</span>
                </p>
                <p className="text-xs text-[#a0a0b8] mt-1">Highly reliable · example data</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Delivered", value: "18" },
                  { label: "On time", value: "94%" },
                  { label: "Confirmed", value: "18" },
                ].map((stat) => (
                  <div key={stat.label} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xl font-black font-mono text-white">{stat.value}</p>
                    <p className="text-[11px] text-[#a0a0b8]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-[#1e1e3f]/80">
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#00ff88]" />
                <h3 className="text-base font-bold text-white">Verified deliveries</h3>
              </div>

              <div className="space-y-2.5">
                {EXAMPLE_DELIVERIES.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#00ff88] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-[#a0a0b8] mt-0.5">
                          Client: {item.clientLabel} &bull; {item.timingLabel}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#00ff88] shrink-0">
                      Confirmed {item.confirmedLabel}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-[#a0a0b8] mt-4">
                Client names are masked. Emails, contracts and payment details are never shown
                publicly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-sm text-white font-medium">
                Your real proof page shows only your confirmed deliveries — nothing is added for
                effect.
              </p>
              <Button asChild variant="electric" size="sm" className="font-bold shrink-0">
                <Link href="/signup">
                  Create my proof page <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
