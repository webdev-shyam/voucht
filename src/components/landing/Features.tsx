"use client";

import { motion } from "framer-motion";
import { Trophy, Globe, FileText, CheckCircle2, Award, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Trophy,
    title: "🏆 Trust Score",
    description: "A verified 0-100 score based on real delivery data. Not reviews. Not endorsements. Proof.",
    highlight: "Real delivery algorithms",
  },
  {
    icon: Globe,
    title: "🌐 Public Proof Page",
    description: "A beautiful, shareable page showing your verified track record. Link it everywhere.",
    highlight: "Custom shareable link",
  },
  {
    icon: FileText,
    title: "📄 AI Smart Contracts",
    description: "Generate professional contracts in 60 seconds. Scope, milestones, payment terms — all AI-powered.",
    highlight: "60-second generation",
  },
  {
    icon: CheckCircle2,
    title: "✅ Verified Delivery Receipts",
    description: "Clients confirm each delivery with one click. Permanent proof you delivered.",
    highlight: "One-click email tokens",
  },
  {
    icon: Award,
    title: "🏅 Embeddable Trust Badge",
    description: "Add your Voucht badge to your website, email signature, or portfolio.",
    highlight: "Live dynamic SVG",
  },
  {
    icon: BarChart3,
    title: "📊 Profile Analytics",
    description: "See who viewed your Proof Page, where they came from, and when.",
    highlight: "Real-time client intent",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            Everything You Need To Win
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Built for Freelancers Who Actually Ship
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            Stop competing on price. Let your verified track record close the deal before the first discovery call.
          </p>
        </div>

        {/* 3x2 Grid of Feature Cards with Glassmorphism & Hover Lift */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 flex flex-col justify-between shadow-xl hover:border-[#00ff88]/40 hover:bg-white/[0.08] transition-all duration-300"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-[#00ff88]/15 group-hover:border-[#00ff88]/40 transition-colors">
                    <Icon className="w-6 h-6 text-[#00ff88]" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00ff88] transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-sm sm:text-base text-[#a0a0b8] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#00ff88]">
                  <span>{feature.highlight}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
