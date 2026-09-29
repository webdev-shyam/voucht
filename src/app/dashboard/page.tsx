"use client";

import Link from "next/link";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustScoreHero } from "@/components/dashboard/TrustScoreHero";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { useAppStore } from "@/store/useAppStore";
import { useTrustScore } from "@/hooks/useTrustScore";
import { useProjects } from "@/hooks/useProjects";

export default function DashboardPage() {
  const user = useAppStore((state) => state.user);
  const activities = useAppStore((state) => state.activities);
  const profileViews = useAppStore((state) => state.profileViews);
  const { hasHistory, onTimeRate } = useTrustScore();
  const { projects, activeProjects } = useProjects();

  const completedProjects = projects.filter((p) => p.status === "completed");

  return (
    <div className="space-y-8 pb-12">
      {/* SECTION 1 — Trust Score Hero Card (full width) */}
      <section>
        <TrustScoreHero />
      </section>

      {/* SECTION 2 — Stats Cards Row (4 cards) */}
      <section>
        <StatsCards
          totalProjects={user?.totalProjects ?? projects.length}
          completedCount={user?.completedProjects ?? completedProjects.length}
          onTimeRate={hasHistory ? onTimeRate : null}
          profileViews={profileViews}
        />
      </section>

      {/* SECTION 3 — Two Column Layout: Left (60%) Active Projects, Right (40%) Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (60% ~ 7 cols): Active Projects */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-electric" />
              <h3 className="text-lg font-bold text-white">
                Active Projects ({activeProjects.length})
              </h3>
            </div>

            <Button asChild size="sm" variant="electric" className="gap-1.5 h-8 text-xs font-bold">
              <Link href="/dashboard/projects/new">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Project</span>
              </Link>
            </Button>
          </div>

          {activeProjects.length > 0 ? (
            <div className="space-y-3.5">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-surfaceLight bg-surface/50 p-8 text-center">
              <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-navyLight flex items-center justify-center text-textSecondary">
                  <FolderKanban className="w-6 h-6 text-textSecondary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    No active projects yet
                  </h4>
                  <p className="text-xs text-textSecondary mt-1">
                    Record a project and its milestones, then send each delivery to
                    your client for confirmation.
                  </p>
                </div>
                <Button asChild size="sm" variant="electric" className="mt-2">
                  <Link href="/dashboard/projects/new">
                    <span>Add your first project →</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT (40% ~ 5 cols): Recent Activity Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Recent Activity</span>
              <span className="text-[10px] font-mono text-electric bg-electric/10 px-2 py-0.5 rounded border border-electric/20">
                {activities.length} EVENTS
              </span>
            </h3>
          </div>

          <Card className="border-surfaceLight bg-surface shadow-md">
            <CardContent className="p-4">
              <RecentActivity activities={activities} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4 — Upgrade Prompt (only for free plan) */}
      <section>
        <UpgradePrompt />
      </section>
    </div>
  );
}
