"use client";

import { motion } from "framer-motion";
import { UserPlus, FolderPlus, CheckCircle2, Share2, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "1",
    title: "Sign up free",
    desc: "Create your profile with an email or a Google account. Pick your specialty and claim your handle. No credit card required.",
    icon: UserPlus,
  },
  {
    step: "2",
    title: "Add your projects & clients",
    desc: "Enter each deliverable, its deadline and the client contact. On Pro you can also generate an editable contract draft with AI.",
    icon: FolderPlus,
  },
  {
    step: "3",
    title: "Deliver & get verified",
    desc: "Mark a milestone as delivered. The client confirms with a one-click link in their email, without creating an account.",
    icon: CheckCircle2,
  },
  {
    step: "4",
    title: "Share your Proof Page",
    desc: "Put your Proof Page link and live badge on proposals, your portfolio and your email signature, so the confirmed work travels with you.",
    icon: Share2,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            Simple 4-Step Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            From your first delivered milestone to a client-verified trust score.
          </p>
        </div>

        {/* 4 steps with numbered circles and connecting lines */}
        <div className="relative">
          {/* Connecting line on desktop */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-[#00ff88]/10 via-[#00ff88]/40 to-[#00ff88]/10 -translate-y-8 pointer-events-none z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#1e1e3f]/80 backdrop-blur-sm shadow-xl hover:border-[#00ff88]/40 transition-all duration-300 group hover:-translate-y-1"
                >
                  {/* Numbered circle with icon */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-[#00ff88] group-hover:bg-[#00ff88]/10 group-hover:border-[#00ff88]/50 transition-all duration-300">
                      <Icon className="w-7 h-7 text-[#00ff88]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#00ff88] text-[#1a1a2e] font-black text-xs flex items-center justify-center shadow-lg shadow-[#00ff88]/30">
                      {s.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ff88] transition-colors">
                    {s.title}
                  </h3>

                  <p className="text-sm text-[#a0a0b8] leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
