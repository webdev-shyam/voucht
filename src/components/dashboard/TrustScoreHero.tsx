"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { useAppStore } from "@/store/useAppStore";

interface TrustScoreHeroProps {
  score: number;
  deliveryRate?: number;
  onTimeRate?: number;
  responseSpeedHours?: number;
  revisionRatio?: number;
  ghostRate?: number;
}

export function TrustScoreHero({
  score = 78,
  deliveryRate = 85,
  onTimeRate = 92,
  responseSpeedHours = 4.2,
  revisionRatio = 1.2,
  ghostRate = 0,
}: TrustScoreHeroProps) {
  const user = useAppStore((state) => state.user);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [copied, setCopied] = useState(false);

  // Animate score from 0 to target on mount
  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Determine ring color
  const ringColor =
    score >= 80 ? "#00ff88" : score >= 60 ? "#fbbf24" : "#f87171";

  // Determine badge display
  const getBadgeDisplay = () => {
    if (score >= 80) {
      return {
        text: "🏆 EXCEPTIONAL",
        variant: "electric" as const,
        description: "Top 5% reliability verified by cryptographic client signatures",
      };
    }
    if (score >= 60) {
      return {
        text: "✅ RELIABLE",
        variant: "secondary" as const,
        description: "Proven record of on-time deliveries and verified client sign-offs",
      };
    }
    return {
      text: "🔨 BUILDING",
      variant: "outline" as const,
      description: "Actively establishing your verifiable proof history",
    };
  };

  const badgeInfo = getBadgeDisplay();

  // SVG Circle calculations
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(100, Math.max(0, animatedScore));
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const publicUrl = `voucht.tech/${user.username}`;

  const handleShare = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    toast({
      title: "Proof link copied!",
      description: `https://${publicUrl} copied to your clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-surfaceLight bg-surface/95 backdrop-blur shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-surfaceLight flex flex-wrap items-center justify-between gap-3 bg-navyLight/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-electric/15 border border-electric/30 flex items-center justify-center text-electric">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Verifiable Trust Engine</span>
              <span className="text-[10px] font-mono uppercase bg-electric/15 text-electric px-2 py-0.5 rounded border border-electric/30">
                LIVE AUDIT
              </span>
            </h2>
            <p className="text-xs text-textSecondary">
              Real-time score weighted by delivery integrity, SLA compliance, and zero ghosting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={badgeInfo.variant}
            className="text-xs font-mono font-bold tracking-wider px-3 py-1 uppercase"
          >
            {badgeInfo.text}
          </Badge>

          <Button
            onClick={handleShare}
            size="sm"
            variant="outline"
            className="text-xs border-surfaceLight hover:border-electric hover:text-white transition-colors gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-electric" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-electric" />
                <span>Share My Proof Page →</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Animated Ring, Right Breakdown */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left (5 cols): Large Animated Ring */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4">
          <div className="relative flex items-center justify-center">
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
              {/* Animated Progress Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ringColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: "stroke-dashoffset 0.8s ease-out, stroke 0.4s ease",
                }}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-black font-mono text-white tracking-tight leading-none">
                {animatedScore}
              </span>
              <span className="text-sm font-bold text-textSecondary font-mono mt-1">
                /100
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-textSecondary mt-1">
                Trust Score
              </span>
            </div>
          </div>

          <p className="text-xs text-textSecondary mt-3 text-center max-w-xs">
            {badgeInfo.description}
          </p>
        </div>

        {/* Right (7 cols): Score Breakdown with individual progress bars */}
        <div className="md:col-span-7 space-y-3.5 border-t md:border-t-0 md:border-l border-surfaceLight pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
              Score Breakdown Metrics
            </span>
            <span className="text-xs font-mono text-electric">Weighted Formula</span>
          </div>

          {/* 1. Delivery Rate */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>📦</span>
                <span>Delivery Rate</span>
              </span>
              <span className="font-mono font-bold text-white">{deliveryRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-navyLight overflow-hidden">
              <div
                className="h-full bg-electric rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, deliveryRate)}%` }}
              />
            </div>
          </div>

          {/* 2. On-Time Rate */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>⏰</span>
                <span>On-Time Rate</span>
              </span>
              <span className="font-mono font-bold text-white">{onTimeRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-navyLight overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, onTimeRate)}%` }}
              />
            </div>
          </div>

          {/* 3. Response Speed */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>💬</span>
                <span>Response Speed</span>
              </span>
              <span className="font-mono font-bold text-white">{responseSpeedHours} hrs avg</span>
            </div>
            <div className="h-2 w-full rounded-full bg-navyLight overflow-hidden">
              {/* Lower hours is better: 100 - (hrs * 8) */}
              <div
                className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(20, Math.min(100, 100 - responseSpeedHours * 8))}%` }}
              />
            </div>
          </div>

          {/* 4. Revision Ratio */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>🔄</span>
                <span>Revision Ratio</span>
              </span>
              <span className="font-mono font-bold text-white">{revisionRatio} avg</span>
            </div>
            <div className="h-2 w-full rounded-full bg-navyLight overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(20, Math.min(100, 100 - (revisionRatio - 1) * 30))}%` }}
              />
            </div>
          </div>

          {/* 5. Ghost Rate */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>👻</span>
                <span>Ghost Rate</span>
              </span>
              <span className="font-mono font-bold text-white">{ghostRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-navyLight overflow-hidden">
              {/* Ghost rate inverted: 0% ghost = 100% full green bar */}
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, 100 - ghostRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
