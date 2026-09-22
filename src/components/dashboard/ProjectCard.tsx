"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/lib/types";
import { formatCurrency, maskClientName } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const milestones = project.milestones || [];
  const confirmedCount = milestones.filter((m) => m.status === "confirmed").length;
  const progressPercent =
    milestones.length > 0 ? Math.round((confirmedCount / milestones.length) * 100) : 0;

  // Deadline calculations
  const deadlineDate = new Date(project.deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = diffDays < 0 && project.status !== "completed";
  const deadlineText = isOverdue
    ? `Overdue by ${Math.abs(diffDays)} days`
    : diffDays === 0
    ? "Due today"
    : `${diffDays} days left`;

  const getStatusBadge = () => {
    if (project.status === "completed") {
      return (
        <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-2 uppercase font-mono">
          Completed
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="text-[10px] py-0 px-2 uppercase font-mono">
          Overdue
        </Badge>
      );
    }
    return (
      <Badge variant="electric" className="text-[10px] py-0 px-2 uppercase font-mono">
        Active
      </Badge>
    );
  };

  return (
    <Card className="border-surfaceLight bg-surface hover:border-surfaceLight/80 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {getStatusBadge()}
              <span className="text-xs text-textSecondary">
                Client:{" "}
                <strong className="text-slate-200 font-mono">
                  {maskClientName(project.clientName)}
                </strong>
              </span>
              {project.clientConfirmed ? (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  ✓ Confirmed
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                  ⏳ Pending Sign-off
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
              {project.title}
            </h4>
          </div>

          <div className="text-right shrink-0">
            <span className="text-lg sm:text-xl font-bold font-mono text-electric">
              {formatCurrency(project.totalBudget, project.currency)}
            </span>
          </div>
        </div>

        {/* Milestone progress bar (completed/total) */}
        <div className="my-3.5">
          <div className="flex justify-between text-xs text-textSecondary mb-1.5 font-medium">
            <span>
              Milestones: {confirmedCount} / {milestones.length} completed
            </span>
            <span className="font-mono text-white">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-surfaceLight text-xs text-textSecondary">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-textSecondary" />
            <span>Target: {deadlineDate.toLocaleDateString()}</span>
            <span
              className={`font-semibold ml-1.5 ${
                isOverdue
                  ? "text-red-400"
                  : diffDays <= 3
                  ? "text-amber-400"
                  : "text-textSecondary"
              }`}
            >
              ({deadlineText})
            </span>
          </div>

          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs hover:text-electric hover:bg-surfaceLight"
          >
            <Link href={`/dashboard/projects/${project.id}`}>
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
