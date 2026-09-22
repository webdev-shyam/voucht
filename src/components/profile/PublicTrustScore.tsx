import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserProfile, TrustScoreFactors } from "@/lib/types";
import { TRUST_TIERS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";

interface PublicTrustScoreProps {
  user: UserProfile;
  factors: TrustScoreFactors;
}

export function PublicTrustScore({ user, factors }: PublicTrustScoreProps) {
  return (
    <div className="p-8 rounded-2xl border border-surfaceLight bg-surface shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-electric/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Profile Details */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-navyMid flex items-center justify-center font-bold text-3xl text-white border-2 border-surfaceLight overflow-hidden">
              {user.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.fullName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-electric border-3 border-navy flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-navy" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {user.fullName}
              </h1>
              <Badge variant="electric" className="text-xs uppercase">
                Verified Pro
              </Badge>
            </div>
            <p className="text-sm font-medium text-textSecondary mb-2">
              @{user.username} &bull; {user.headline || "Independent Consultant"}
            </p>
            <p className="text-xs text-textSecondary max-w-lg leading-relaxed">
              {user.bio}
            </p>
          </div>
        </div>

        {/* Big Trust Badge Display */}
        <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-navyLight border border-surfaceLight min-w-[220px]">
          <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary mb-1">
            Voucht Score
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black font-mono text-electric">
              {factors.overallScore}
            </span>
            <span className="text-xl font-bold font-mono text-textSecondary">
              /100
            </span>
          </div>
          <span className="mt-2 text-xs font-bold text-white px-3 py-1 rounded-full bg-electric/10 border border-electric/30">
            {TRUST_TIERS.ELITE.label}
          </span>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-textSecondary">
            <CheckCircle2 className="w-3.5 h-3.5 text-electric" />
            <span>Cryptographically Verified</span>
          </div>
        </div>
      </div>

      {/* Trust Factors Breakdown Grid */}
      <div className="mt-8 pt-6 border-t border-surfaceLight grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="flex justify-between text-xs text-textSecondary mb-1">
            <span>On-Time Delivery</span>
            <span className="font-mono font-bold text-white">{factors.onTimeDelivery}%</span>
          </div>
          <Progress value={factors.onTimeDelivery} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-textSecondary mb-1">
            <span>Client Sign-offs</span>
            <span className="font-mono font-bold text-white">{factors.clientConfirmations}%</span>
          </div>
          <Progress value={factors.clientConfirmations} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-textSecondary mb-1">
            <span>Dispute Freedom</span>
            <span className="font-mono font-bold text-white">{factors.disputeRate}%</span>
          </div>
          <Progress value={factors.disputeRate} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-textSecondary mb-1">
            <span>Longevity & Volume</span>
            <span className="font-mono font-bold text-white">{factors.platformLongevity}%</span>
          </div>
          <Progress value={factors.platformLongevity} />
        </div>
      </div>
    </div>
  );
}
