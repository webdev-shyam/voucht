"use client";

import { useState } from "react";
import { Check, Copy, Code2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { canAccess } from "@/lib/utils";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

interface TrustBadgePreviewProps {
  username: string;
}

export function TrustBadgePreview({ username }: TrustBadgePreviewProps) {
  const user = useAppStore((state) => state.user);
  const [copied, setCopied] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasAccess = canAccess(user.tier, "trust_badge");

  const badgeUrl = `/badge/${username}`;
  const markdownSnippet = `[![Voucht Trust Score](${typeof window !== "undefined" ? window.location.origin : ""}/badge/${username})](${typeof window !== "undefined" ? window.location.origin : ""}/profile/${username})`;
  const htmlSnippet = `<a href="${typeof window !== "undefined" ? window.location.origin : ""}/profile/${username}"><img src="${typeof window !== "undefined" ? window.location.origin : ""}/badge/${username}" alt="Voucht Trust Score" /></a>`;

  const copyToClipboard = (text: string, type: string) => {
    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="border-surfaceLight bg-surface">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-electric" />
            <span>Embeddable Live Trust Badge</span>
          </CardTitle>
          {!hasAccess && (
            <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px] uppercase font-bold gap-1">
              <Lock className="w-3 h-3" /> Pro Feature
            </Badge>
          )}
        </div>
        <CardDescription className="text-textSecondary text-xs">
          Embed this live badge on your personal portfolio, GitHub README, or proposals. It updates in real time.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {/* Badge Preview rendering (Visible to all tiers so they see what they get!) */}
        <div className="p-6 rounded-xl bg-navyLight border border-surfaceLight flex flex-col items-center justify-center">
          <div className="mb-2 text-xs text-textSecondary">Live Badge Preview:</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl}
            alt="Voucht Trust Badge"
            className="h-9 hover:opacity-95 transition-opacity cursor-pointer shadow-lg"
          />
        </div>

        {/* Code Snippets or Locked Overlay */}
        <div className="relative">
          <div className={!hasAccess ? "filter blur-[2px] opacity-40 select-none pointer-events-none space-y-4" : "space-y-4"}>
            {/* Copy snippets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-textSecondary uppercase">
                  Markdown Code (GitHub, Notion)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-surfaceLight"
                  onClick={() => copyToClipboard(markdownSnippet, "md")}
                >
                  {copied === "md" ? (
                    <>
                      <Check className="w-3 h-3 text-electric" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Markdown
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-navy text-xs text-textSecondary font-mono overflow-x-auto border border-surfaceLight">
                {markdownSnippet}
              </pre>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-textSecondary uppercase">
                  HTML Embed Code
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-surfaceLight"
                  onClick={() => copyToClipboard(htmlSnippet, "html")}
                >
                  {copied === "html" ? (
                    <>
                      <Check className="w-3 h-3 text-electric" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy HTML
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-navy text-xs text-textSecondary font-mono overflow-x-auto border border-surfaceLight">
                {htmlSnippet}
              </pre>
            </div>
          </div>

          {/* Locked Overlay for Free Tier */}
          {!hasAccess && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-navy/80 backdrop-blur-[3px] rounded-xl border border-electric/30 p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-electric/10 border border-electric/30 flex items-center justify-center text-electric mb-2.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Unlock Live Dynamic SVG Badges
              </h4>
              <p className="text-xs text-textSecondary max-w-sm mb-3">
                Embed your verified reputation badge into your GitHub README, personal website, and pitch decks.
              </p>
              <Button
                variant="electric"
                size="sm"
                className="font-bold text-xs gap-1.5 shadow-lg"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Sparkles className="w-3.5 h-3.5 text-navy" />
                <span>Upgrade to Pro — $10/mo →</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="trust_badge"
      />
    </Card>
  );
}
