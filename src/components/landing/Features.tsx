"use client";

import { motion } from "framer-motion";
import { Trophy, Globe, FileText, CheckCircle2, Award, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Trophy,
    title: "🏆 Trust Score",
    description: "A 0-100 score calculated from recorded, client-confirmed deliveries. Not reviews. Not endorsements. Work.",
    highlight: "Weighted 40/25/20/15",
  },
  {
    icon: Globe,
    title: "🌐 Public Proof Page",
    description: "A shareable page showing your confirmed track record at voucht.tech/your-name. Link it everywhere.",
    highlight: "One link to share",
  },
  {
    icon: FileText,
    title: "📄 AI contract drafts",
    description: "Turn a project and its milestones into an editable agreement draft: scope, deadlines, payment terms.",
    highlight: "Pro & Elite · review before sending",
  },
  {
    icon: CheckCircle2,
    title: "✅ Confirmed deliveries",
    description: "Clients confirm each delivery with one click from their email, no account needed.",
    highlight: "Single-use links",
  },
  {
    icon: Award,
    title: "🏅 Embeddable trust badge",
    description: "Add your Voucht badge to your website, GitHub README, or email signature.",
    highlight: "Live SVG, updates itself",
  },
  {
    icon: BarChart3,
    title: "📊 Proof page analytics",
    description: "See how many people opened your proof page, which sites they came from, and when.",
    highlight: "Elite · visitors stay anonymous",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#1a1a2e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            What you get
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Built for Freelancers Who Actually Ship
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            Put client-confirmed work in front of prospects before the first
            discovery call.
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
