"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function FinalCta() {
  return (
    <section className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00ff88]/15 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#1e1e3f] to-[#16162c] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-black/60"
        >
          {/* Decorative badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-xs font-bold text-[#00ff88] uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" /> Free to start
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
            Ready to get vouched?
          </h2>

          <p className="text-base sm:text-xl text-[#a0a0b8] max-w-2xl mx-auto leading-relaxed mb-10">
            Create your proof page, send your first client a confirmation link,
            and let completed work do the talking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button
              asChild
              size="lg"
              variant="electric"
              className="h-14 px-10 text-base font-bold shadow-[0_0_30px_rgba(0,255,136,0.35)] hover:shadow-[0_0_40px_rgba(0,255,136,0.5)] gap-2"
            >
              <Link href="/signup">
                <span>Create Free Account</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-[#a0a0b8] flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-[#00ff88]" /> No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
