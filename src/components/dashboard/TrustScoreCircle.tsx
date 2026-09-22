"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { getTierForScore } from "@/lib/trust-score";

interface TrustScoreCircleProps {
  score: number;
  size?: number;
  showBreakdown?: boolean;
}

export function TrustScoreCircle({
  score,
  size = 200,
  showBreakdown = true,
}: TrustScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500; // ms (1.5s easeOut)
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(ease * score));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [score]);

  const tier = getTierForScore(score);
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* SVG Circle */}
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#16213e"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00ff88"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-electric mb-1">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
            {animatedScore}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary mt-0.5">
            Trust Score
          </span>
          <span
            className="text-xs font-bold mt-1 px-2.5 py-0.5 rounded-full border text-[11px]"
            style={{
              borderColor: `${tier.color}40`,
              backgroundColor: `${tier.color}15`,
              color: tier.color,
            }}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {showBreakdown && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-textSecondary">
          <TrendingUp className="w-3.5 h-3.5 text-electric" />
          <span>Top 5% verified reliability rating</span>
        </div>
      )}
    </div>
  );
}
