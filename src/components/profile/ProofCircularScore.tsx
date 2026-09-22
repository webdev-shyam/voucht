"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ProofCircularScoreProps {
  score: number;
  totalDeliveries: number;
  tier: "exceptional" | "reliable" | "building";
}

export function ProofCircularScore({ score, totalDeliveries, tier }: ProofCircularScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = Math.max(1, Math.floor(score / 35));
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [score]);

  // Thresholds: green 80+, yellow 60-79, red below 60
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#00ff88", text: "text-[#00ff88]", bg: "bg-[#00ff88]/10", border: "border-[#00ff88]/30" };
    if (s >= 60) return { stroke: "#fbbf24", text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" };
    return { stroke: "#f87171", text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" };
  };

  const colors = getColor(score);

  // Circular gauge math (radius 80, circumference 2 * pi * 80 ~= 502.65)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const tierBadgeText =
    score >= 80
      ? "🏆 EXCEPTIONAL"
      : score >= 60
      ? "✅ RELIABLE"
      : "🔨 BUILDING";

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Glow effect behind gauge */}
        <div
          className="absolute inset-4 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: colors.stroke }}
        />

        <svg className="w-56 h-56 -rotate-90 transform" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#1f2338"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress ring */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
            {animatedScore}
          </span>
          <span className="text-xs font-mono font-semibold text-textSecondary uppercase tracking-widest mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Tier Badge */}
      <div className={`mt-3 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border ${colors.bg} ${colors.border} ${colors.text}`}>
        {tierBadgeText}
      </div>

      {/* Verified deliveries count */}
      <p className="text-xs text-textSecondary mt-2">
        Based on <strong className="text-white font-mono">{totalDeliveries}</strong> verified deliveries
      </p>
    </div>
  );
}
