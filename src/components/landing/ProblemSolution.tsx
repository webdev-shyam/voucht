"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";

export function ProblemSolution() {
  const problems = [
    "Reliability claims are self-reported, so nobody has to check them",
    "Clients have no way to verify your delivery history before hiring",
    "A portfolio shows skill, not whether deadlines were actually met",
    "Reviews can be written by anyone, including friends",
  ];

  const solutions = [
    "The Trust Score is calculated from deliveries your clients confirmed",
    "Prospects see the record before they sign anything",
    "A delivery only counts once the client agrees it happened",
    "Client names are masked, so the proof stays shareable",
  ];

  return (
    <section className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            The Freelance Trust Dilemma
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            Clients don&apos;t just ask &ldquo;can you do the work?&rdquo; &mdash; they fear paying a stranger who might ghost, deliver late, or cause friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left: The Problem Card (Red Accent) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-red-500/20 bg-[#1e1e3f]/80 backdrop-blur-sm p-8 sm:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-red-500/40 transition-colors"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    The Old Way
                  </span>
                  <h3 className="text-2xl font-bold text-white">The Problem</h3>
                </div>
              </div>

              <ul className="space-y-5">
                {problems.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-[#a0a0b8] leading-relaxed">
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-xs text-red-400/80 font-medium">
              Result: Endless bidding wars, price slashing, and skeptical prospects.
            </div>
          </motion.div>

          {/* Right: The Solution Card (Green Accent) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border border-[#00ff88]/30 bg-[#1e1e3f]/90 backdrop-blur-sm p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-[#00ff88]/60 transition-colors"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff88]/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00ff88]">
                    The Voucht Way
                  </span>
                  <h3 className="text-2xl font-bold text-white">The Solution</h3>
                </div>
              </div>

              <ul className="space-y-5">
                {solutions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-[#00ff88] shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-[#00ff88] font-semibold flex items-center gap-1.5">
              <span>Every claim on a proof page traces back to a delivery a client confirmed.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
