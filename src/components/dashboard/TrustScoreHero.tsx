"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Share2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useAppStore } from "@/store/useAppStore";
import {
  BADGE_TIERS,
  NO_HISTORY_MESSAGE,
  TRUST_SCORE_WEIGHTS,
  formatTrustScore,
} from "@/lib/trust-score";
import { proofPageUrl } from "@/lib/utils";

// Displays the Trust Score the database calculated. This component never
// derives, rounds up, or substitutes a number: when there is no client-confirmed
// delivery it says so.
export function TrustScoreHero() {
  const user = useAppStore((state) => state.user);
  const status = useAppStore((state) => state.status);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [copied, setCopied] = useState(false);

  const score = user?.trustScore ?? null;
  const hasHistory = score !== null;

  useEffect(() => {
    if (score === null) {
      setAnimatedScore(0);
      return;
    }
    let current = 0;
    const steps = 75;
    const increment = score / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  if (!user) {
    return (
      <div className="w-full h-[260px] rounded-2xl border border-surfaceLight bg-surface/60 animate-pulse" />
    );
  }

  const badge = BADGE_TIERS[user.badgeTier] ?? BADGE_TIERS.none;
  const ringColor = hasHistory ? badge.color : "#a0a0b8";
  const publicUrl = proofPageUrl(user.username);

  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, animatedScore)) / 100) * circumference;

  const handleShare = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast({
      title: "Proof link copied",
      description: publicUrl,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-surfaceLight bg-surface/95 backdrop-blur shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-surfaceLight flex flex-wrap items-center justify-between gap-3 bg-navyLight/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-electric/15 border border-electric/30 flex items-center justify-center text-electric">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Trust Score</h2>
            <p className="text-xs text-textSecondary">
              Calculated from your client-confirmed deliveries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={user.badgeTier === "exceptional" ? "electric" : "secondary"}
            className="text-xs font-mono font-bold tracking-wider px-3 py-1 uppercase"
          >
            {badge.label}
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
                <span>Share my proof page</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4">
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="rotate-[-90deg]" aria-hidden="true">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#16213e"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
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

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-black font-mono text-white tracking-tight leading-none">
                {hasHistory ? animatedScore : "—"}
              </span>
              <span className="text-sm font-bold text-textSecondary font-mono mt-1">
                {hasHistory ? "/100" : ""}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-textSecondary mt-1">
                Trust Score
              </span>
            </div>
          </div>

          {hasHistory ? (
            <p className="text-xs text-textSecondary mt-3 text-center max-w-xs">
              {badge.requirement}
            </p>
          ) : (
            <div className="mt-3 text-center max-w-xs space-y-2">
              <p className="text-sm font-semibold text-white">{NO_HISTORY_MESSAGE}</p>
              <p className="text-xs text-textSecondary">
                {status === "loading"
                  ? "Loading your record…"
                  : "A score appears after your first delivery is confirmed by a client."}
              </p>
              <Button asChild size="sm" variant="electric" className="mt-1 text-xs">
                <Link href="/dashboard/projects/new">Create your first project</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="md:col-span-7 space-y-3.5 border-t md:border-t-0 md:border-l border-surfaceLight pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
              What counts toward it
            </span>
            <span className="text-xs font-mono text-electric">40 / 25 / 20 / 15</span>
          </div>

          {TRUST_SCORE_WEIGHTS.map((factor) => (
            <div key={factor.key} className="space-y-1">
              <div className="flex justify-between text-xs gap-3">
                <span className="text-slate-300 font-medium">{factor.label}</span>
                <span className="font-mono font-bold text-white shrink-0">
                  {factor.weight}%
                </span>
              </div>
              <p className="text-[11px] text-textSecondary leading-snug">{factor.detail}</p>
            </div>
          ))}

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surfaceLight">
            <Metric
              label="Completed"
              value={`${user.completedProjects}/${user.totalProjects}`}
            />
            <Metric
              label="On time"
              value={hasHistory ? `${formatTrustScore(user.onTimeRate)}%` : "—"}
            />
            <Metric
              label="Cancelled"
              value={hasHistory ? `${formatTrustScore(user.ghostRate)}%` : "—"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surfaceLight bg-navyLight/40 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-textSecondary block">
        {label}
      </span>
      <span className="text-base font-bold font-mono text-white">{value}</span>
    </div>
  );
}
