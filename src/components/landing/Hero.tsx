"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  const score = 94;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[600px] h-[400px] bg-[#00ff88]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-[#0f3460]/40 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Side (60% ~ 7 cols) */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Small badge above headline */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#00ff88]/30 backdrop-blur-sm mb-6 text-xs sm:text-sm font-medium text-[#00ff88]">
              <span>🚀 The trust layer for freelancers</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6">
              Get Vouched.
              <br />
              <span className="text-[#00ff88]">Get Hired.</span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-xl text-[#a0a0b8] max-w-xl leading-relaxed mb-8">
              Clients don&apos;t hire the best freelancer. They hire the one they
              <span className="text-white font-medium"> TRUST </span>
              most. Voucht gives you a verified Trust Score that proves your reliability — before you even get hired.
            </p>

            {/* Two CTA buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-6">
              <Button
                asChild
                size="lg"
                variant="electric"
                className="h-14 px-8 text-base font-semibold shadow-[0_0_25px_rgba(0,255,136,0.35)] hover:shadow-[0_0_35px_rgba(0,255,136,0.5)]"
              >
                <Link href="/signup">
                  <span>Create My Free Profile</span>
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base font-medium border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm"
              >
                <Link href="#example-proof">
                  <span>See what your page looks like</span>
                  <ArrowRight className="ml-2 w-4 h-4 text-[#00ff88]" />
                </Link>
              </Button>
            </div>

            {/* Small trust text below */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#a0a0b8]">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#00ff88]" /> Free forever
              </span>
              <span className="text-white/20 hidden sm:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#00ff88]" /> No credit card
              </span>
              <span className="text-white/20 hidden sm:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#00ff88]" /> Sign up in a few minutes
              </span>
            </div>
          </motion.div>

          {/* Right Side (40% ~ 5 cols) - Floating Mock Trust Score Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.2 },
                scale: { duration: 0.6, delay: 0.2 },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div className="relative rounded-2xl border border-white/15 bg-[#1e1e3f]/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/50 overflow-hidden">
                {/* Subtle top light highlight */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00ff88]/15 rounded-full blur-2xl pointer-events-none" />

                <span className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-black/50 border-l border-b border-white/10 text-[10px] uppercase tracking-wider text-[#a0a0b8]">
                  Illustrative example
                </span>

                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 mb-6 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/40 flex items-center justify-center text-xl font-bold text-[#00ff88]">
                        JD
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00ff88] flex items-center justify-center text-[#1a1a2e] shadow-md">
                        <ShieldCheck className="w-4 h-4 text-[#1a1a2e]" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white">Your name</h3>
                      <p className="text-sm font-medium text-[#a0a0b8]">Your headline</p>
                      <p className="text-xs text-[#00ff88] mt-0.5 font-mono">voucht.tech/your-name</p>
                    </div>
                  </div>
                </div>

                {/* Center: Circular Progress Ring */}
                <div className="my-6 py-4 flex flex-col items-center justify-center bg-black/20 rounded-xl border border-white/5">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background track */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#2a2a4a"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Score progress */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#00ff88"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black font-mono text-white tracking-tight">
                        {score}
                      </span>
                      <span className="text-[11px] font-semibold text-[#a0a0b8] uppercase tracking-wider">
                        / 100 Trust
                      </span>
                    </div>
                  </div>
                  <span className="mt-2 text-xs text-[#a0a0b8] font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00ff88]" /> Calculated from client-confirmed
                    deliveries
                  </span>
                </div>

                {/* Stats the product actually records */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-center">
                  {[
                    { label: "Delivered", value: "18" },
                    { label: "On time", value: "94%" },
                    { label: "Confirmed", value: "18" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-2 rounded-lg bg-white/5">
                      <p className="text-xs text-[#a0a0b8] mb-0.5">{stat.label}</p>
                      <p className="text-sm font-bold text-white font-mono">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
