"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldCheck, Sparkles, Clock, Lock } from "lucide-react";
import { PublicTrustScore } from "@/components/profile/PublicTrustScore";
import { UserProfile, TrustScoreFactors } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_USER: UserProfile = {
  id: "alex-sample-id",
  email: "alex@riveradesign.co",
  username: "alexrivera",
  fullName: "Alex Rivera",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  headline: "Principal Systems Architect & Next.js Engineer",
  bio: "10+ years shipping mission-critical fintech web applications. I deliver early, communicate proactively, and never leave codebases undocumented.",
  role: "freelancer",
  trustScore: 96,
  tier: "pro",
  createdAt: "2024-01-15T00:00:00Z",
  verifiedDeliveriesCount: 38,
  onTimeRate: 98,
  clientSatisfactionScore: 99,
  badgeTier: "exceptional",
  location: "San Francisco, CA",
  skill: "Developer",
};

const MOCK_FACTORS: TrustScoreFactors = {
  overallScore: 96,
  onTimeDelivery: 98,
  clientConfirmations: 95,
  disputeRate: 100,
  platformLongevity: 92,
  badges: ["Elite Verified", "100% Delivery Rate", "Fast Responder"],
};

const MOCK_DELIVERIES = [
  {
    title: "SOC-2 Compliant Authentication & Session Ledger",
    client: "FinVault Global",
    completedDate: "2 days ago",
    hash: "0x8f2a...4b9c",
    status: "Verified by Client VP of Eng",
    amount: "$8,500",
  },
  {
    title: "High-Throughput Webhook Processing Pipeline",
    client: "OmniCart Commerce",
    completedDate: "2 weeks ago",
    hash: "0x3e1d...7a0f",
    status: "Verified by Founder & CTO",
    amount: "$12,000",
  },
  {
    title: "Design System & React Component Library v2",
    client: "Prism Health",
    completedDate: "1 month ago",
    hash: "0x9c4b...112e",
    status: "Verified by Lead Product Manager",
    amount: "$6,200",
  },
];

export function ExampleProofPage() {
  return (
    <section id="example-proof" className="py-24 bg-[#1a1a2e]/90 border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00ff88]/5 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            Live Client View
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            The Verified Proof Page
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            Share your custom Voucht link on Upwork, cold outreach emails, Notion proposals, and X.
          </p>
        </div>

        {/* Mock browser frame */}
        <div className="rounded-2xl border border-white/15 bg-[#1a1a2e] shadow-2xl overflow-hidden">
          {/* Browser header bar */}
          <div className="px-4 py-3 bg-[#1e1e3f] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>

            <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-black/30 border border-white/10 text-xs text-[#a0a0b8] font-mono">
              <Lock className="w-3 h-3 text-[#00ff88]" />
              <span>voucht.tech/profile/alexrivera</span>
            </div>

            <Button asChild variant="ghost" size="sm" className="text-xs text-[#a0a0b8] hover:text-white h-7 px-2">
              <Link href="/profile/alexrivera" target="_blank">
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {/* Browser Content */}
          <div className="p-4 sm:p-8 bg-[#1a1a2e] space-y-8">
            {/* Reusing the PublicTrustScore component */}
            <PublicTrustScore user={MOCK_USER} factors={MOCK_FACTORS} />

            {/* Verified Delivery Receipts Ledger */}
            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#1e1e3f]/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#00ff88]" />
                  <h3 className="text-lg font-bold text-white">
                    Verified Milestone Deliveries
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#00ff88] bg-[#00ff88]/10 px-2.5 py-1 rounded-full border border-[#00ff88]/20">
                  Cryptographically Hashed
                </span>
              </div>

              <div className="space-y-3">
                {MOCK_DELIVERIES.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#a0a0b8]">
                        <span className="text-white/90 font-medium">{item.client}</span>
                        <span>&bull;</span>
                        <span>{item.completedDate}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px] text-[#a0a0b8]/80">{item.hash}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                      <span className="text-sm font-mono font-bold text-white">{item.amount}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00ff88] bg-[#00ff88]/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="mt-8 text-center">
          <p className="text-base sm:text-lg font-medium text-white">
            &ldquo;This is what your clients see. Impressive, right?&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-[#a0a0b8] mt-1">
            Zero fake reviews. Real delivered milestones backed by client digital signatures.
          </p>
        </div>
      </div>
    </section>
  );
}
