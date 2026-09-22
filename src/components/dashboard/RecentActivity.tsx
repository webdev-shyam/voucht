"use client";

import { ActivityItem } from "@/lib/types";
import { CheckCircle2, Clock, Mail, Package, PlusCircle, Sparkles } from "lucide-react";

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  // If activities is empty or short, ensure we provide the rich defaults
  const displayActivities =
    activities && activities.length > 0
      ? activities
      : [
          {
            id: "act-1",
            title: "Sarah confirmed delivery of 'Frontend Milestone'",
            type: "milestone_confirmed" as const,
            timestamp: "2 hours ago",
            scoreChange: 4,
            description: "Client verified delivery and released milestone seal.",
          },
          {
            id: "act-2",
            title: "You submitted 'Backend API' milestone",
            type: "milestone_delivered" as const,
            timestamp: "5 hours ago",
            description: "Proof packet generated and sent for client sign-off.",
          },
          {
            id: "act-3",
            title: "New project 'E-commerce Site' created",
            type: "project_created" as const,
            timestamp: "Yesterday",
            description: "Milestone timeline initialized with 3 deliverables.",
          },
          {
            id: "act-4",
            title: "Reminder sent for 'Design Mockup' milestone (due in 2 days)",
            type: "reminder_sent" as const,
            timestamp: "2 days ago",
            description: "Automated SLA reminder dispatched to client.",
          },
        ];

  const getIcon = (type: string) => {
    switch (type) {
      case "milestone_confirmed":
        return <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />;
      case "milestone_delivered":
        return <Package className="w-4 h-4 text-sky-400" />;
      case "project_created":
        return <PlusCircle className="w-4 h-4 text-indigo-400" />;
      case "reminder_sent":
        return <Mail className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-textSecondary" />;
    }
  };

  return (
    <div className="space-y-3">
      {displayActivities.slice(0, 6).map((act) => (
        <div
          key={act.id}
          className="flex items-start gap-3 p-3.5 rounded-xl border border-surfaceLight bg-navyLight/40 hover:bg-navyLight transition-colors"
        >
          <div className="p-2 rounded-lg bg-surface border border-surfaceLight shrink-0 mt-0.5">
            {getIcon(act.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                {act.title}
              </h5>
              <span className="text-[11px] font-mono text-textSecondary shrink-0">
                {act.timestamp}
              </span>
            </div>
            {act.description && (
              <p className="text-[11px] text-textSecondary mt-0.5 line-clamp-2 leading-relaxed">
                {act.description}
              </p>
            )}
          </div>
          {act.scoreChange ? (
            <span className="text-[11px] font-bold font-mono text-electric shrink-0 bg-electric/10 px-2 py-0.5 rounded border border-electric/20">
              +{act.scoreChange}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
