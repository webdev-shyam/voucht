"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { canAccess } from "@/lib/utils";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

interface StatsCardsProps {
  totalProjects: number;
  completedCount: number;
  // null until a client confirms a delivery: there is no on-time rate to report.
  onTimeRate: number | null;
  // null when the plan does not include visitor analytics.
  profileViews: number | null;
}

export function StatsCards({
  totalProjects,
  completedCount,
  onTimeRate,
  profileViews,
}: StatsCardsProps) {
  const user = useAppStore((state) => state.user);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const hasAnalyticsAccess = canAccess(user?.tier, "profile_analytics");

  const completionRate =
    totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projects */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.0 }}
          whileHover={{ y: -2 }}
        >
          <Card className="border-surfaceLight bg-surface hover:border-surfaceLight/80 transition-colors h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">
                  Total Projects
                </span>
                <div className="w-8 h-8 rounded-lg bg-navyLight border border-surfaceLight flex items-center justify-center text-textSecondary">
                  <FolderKanban className="w-4 h-4 text-electric" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white font-mono">
                  {totalProjects}
                </h3>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-textSecondary">
                <span className="font-semibold">On Voucht</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Completed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Card className="border-surfaceLight bg-surface hover:border-surfaceLight/80 transition-colors h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">
                  Completed
                </span>
                <div className="w-8 h-8 rounded-lg bg-navyLight border border-surfaceLight flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white font-mono">
                  {completedCount}
                </h3>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="font-semibold">{completionRate}% completion rate</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: On-Time Rate */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          whileHover={{ y: -2 }}
        >
          <Card className="border-surfaceLight bg-surface hover:border-surfaceLight/80 transition-colors h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">
                  On-Time Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-navyLight border border-surfaceLight flex items-center justify-center text-sky-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <h3
                  className={`text-3xl font-extrabold font-mono ${
                    onTimeRate === null
                      ? "text-textSecondary"
                      : onTimeRate >= 90
                      ? "text-electric"
                      : onTimeRate >= 75
                      ? "text-sky-400"
                      : "text-amber-400"
                  }`}
                >
                  {onTimeRate === null ? "—" : `${Math.round(onTimeRate)}%`}
                </h3>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-textSecondary">
                <span>
                  {onTimeRate === null
                    ? "Appears after a confirmed delivery"
                    : "Of client-confirmed deliveries"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 4: Profile Analytics (Elite only, else show teaser with "Upgrade to Elite" overlay) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <Card className="border-surfaceLight bg-surface hover:border-surfaceLight/80 transition-colors relative overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">
                  Profile Views
                </span>
                <div className="w-8 h-8 rounded-lg bg-navyLight border border-surfaceLight flex items-center justify-center text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
              </div>

              {hasAnalyticsAccess ? (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-extrabold text-white font-mono">
                      {profileViews ?? "—"}
                    </h3>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-semibold">
                      {profileViews === null ? "Counting visits since today" : "Total visits"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <h3 className="text-3xl font-extrabold text-white font-mono">Elite</h3>
                  <Button
                    size="sm"
                    variant="electric"
                    onClick={() => setShowUpgradeModal(true)}
                    className="h-8 text-[11px] font-bold gap-1 px-3 shadow-md bg-electric text-navy hover:bg-electric/90 self-start"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Upgrade to Elite</span>
                  </Button>
                  <span className="text-[10px] text-textSecondary">
                    Elite plans count who views your proof page.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="profile_analytics"
      />
    </>
  );
}
