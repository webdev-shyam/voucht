"use client";

import { ActivityItem } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Package,
  PlusCircle,
  ShieldCheck,
  UserCog,
} from "lucide-react";

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <p className="text-xs text-textSecondary py-6 text-center">
        Nothing recorded yet. Creating a project is the first entry.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 6).map((act) => (
        <div
          key={act.id}
          className="flex items-start gap-3 p-3.5 rounded-xl border border-surfaceLight bg-navyLight/40 hover:bg-navyLight transition-colors"
        >
          <div className="p-2 rounded-lg bg-surface border border-surfaceLight shrink-0 mt-0.5">
            {iconFor(act.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                {act.title}
              </h5>
              <span className="text-[11px] font-mono text-textSecondary shrink-0">
                {relativeTime(act.createdAt)}
              </span>
            </div>
            {act.description && (
              <p className="text-[11px] text-textSecondary mt-0.5 line-clamp-2 leading-relaxed">
                {act.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function iconFor(type: string) {
  switch (type) {
    case "delivery_confirmed":
      return <ShieldCheck className="w-4 h-4 text-[#00ff88]" />;
    case "delivery_submitted":
      return <Package className="w-4 h-4 text-sky-400" />;
    case "delivery_disputed":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case "project_created":
    case "milestone_created":
      return <PlusCircle className="w-4 h-4 text-indigo-400" />;
    case "contract_created":
      return <FileText className="w-4 h-4 text-slate-300" />;
    case "profile_updated":
      return <UserCog className="w-4 h-4 text-slate-300" />;
    case "project_cancelled":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case "subscription_changed":
      return <CheckCircle2 className="w-4 h-4 text-electric" />;
    default:
      return <PlusCircle className="w-4 h-4 text-textSecondary" />;
  }
}
