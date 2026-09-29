"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { BadgeTier } from "@/lib/types";
import { badgeFor } from "@/lib/trust-score";

interface ProofCircularScoreProps {
  // The stored score, exactly as the database calculated it. null means the
  // freelancer has no evidence yet, which is rendered as such.
  score: number | null;
  totalDeliveries: number;
  tier: BadgeTier;
}

const TIER_STYLE: Record<BadgeTier, { text: string; bg: string; border: string }> = {
  exceptional: { text: "text-[#00ff88]", bg: "bg-[#00ff88]/10", border: "border-[#00ff88]/30" },
  reliable: { text: "text-[#22c55e]", bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/30" },
  building: { text: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30" },
  none: { text: "text-textSecondary", bg: "bg-white/5", border: "border-surfaceLight" },
};

const radius = 80;
const circumference = 2 * Math.PI * radius;

export function ProofCircularScore({ score, totalDeliveries, tier }: ProofCircularScoreProps) {
  const badge = badgeFor(tier);
  const style = TIER_STYLE[tier] ?? TIER_STYLE.none;
  const numericScore = score === null ? 0 : Math.round(score);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (score === null) {
      setAnimatedScore(0);
      return;
    }
    let current = 0;
    const increment = Math.max(1, Math.floor(numericScore / 35));
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericScore) {
        setAnimatedScore(numericScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [numericScore, score]);

  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <div
          className="absolute inset-4 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: badge.color }}
        />

        <svg className="w-56 h-56 -rotate-90 transform" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#1f2338"
            strokeWidth="12"
            fill="transparent"
          />
          {score !== null && (
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              stroke={badge.color}
              strokeWidth="12"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              strokeLinecap="round"
              fill="transparent"
            />
          )}
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
            {score === null ? "—" : animatedScore}
          </span>
          <span className="text-xs font-mono font-semibold text-textSecondary uppercase tracking-widest mt-0.5">
            {score === null ? "awaiting evidence" : "/ 100"}
          </span>
        </div>
      </div>

      <div
        className={`mt-3 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border ${style.bg} ${style.border} ${style.text}`}
      >
        {badge.label}
      </div>

      <p className="text-xs text-textSecondary mt-2">
        {score === null ? (
          "No verified work history yet."
        ) : (
          <>
            Based on <strong className="text-white font-mono">{totalDeliveries}</strong>{" "}
            client-confirmed deliveries
          </>
        )}
      </p>
    </div>
  );
}
