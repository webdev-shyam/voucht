"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

export function UpgradePrompt() {
  const user = useAppStore((state) => state.user);

  // Only show on free plan
  if (user.tier !== "free") return null;

  return (
    <Card className="border border-electric/30 bg-gradient-to-r from-surface to-navyLight relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-electric/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-electric text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Freelancer Pro Tier</span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white">
            Unlock unlimited projects, Trust Badge, and AI Contracts
          </h4>
          <p className="text-xs text-textSecondary max-w-xl">
            Free plan allows 1 active project. Upgrade to Pro to send unlimited client verification requests, embed live SVG badges, and generate AI legal contracts.
          </p>
        </div>

        <Button asChild variant="electric" size="sm" className="shrink-0 font-bold h-9 shadow-md">
          <Link href="/dashboard/billing">
            <span>Upgrade to Pro — $10/mo →</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
