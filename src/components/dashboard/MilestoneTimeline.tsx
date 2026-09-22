"use client";

import { CheckCircle2, Clock, ExternalLink, Send, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Milestone } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface MilestoneTimelineProps {
  milestones: Milestone[];
  currency?: string;
  onDeliver?: (milestoneId: string) => void;
  onConfirm?: (milestoneId: string) => void;
  showActions?: boolean;
}

export function MilestoneTimeline({
  milestones,
  currency = "USD",
  onDeliver,
  onConfirm,
  showActions = true,
}: MilestoneTimelineProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-textSecondary text-sm border border-dashed border-surfaceLight rounded-xl">
        No milestones defined yet. Add your first delivery goal above.
      </div>
    );
  }

  const getStatusBadge = (status: Milestone["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="electric">Verified & Signed-off</Badge>;
      case "delivered":
        return <Badge variant="warning">Awaiting Client Confirmation</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "disputed":
        return <Badge variant="destructive">Disputed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {milestones.map((ms, idx) => {
        const isConfirmed = ms.status === "confirmed";
        const isDelivered = ms.status === "delivered";

        return (
          <div
            key={ms.id || idx}
            className={`p-5 rounded-xl border transition-all ${
              isConfirmed
                ? "bg-surface border-electric/30"
                : isDelivered
                ? "bg-surface border-warning/30"
                : "bg-surface/70 border-surfaceLight"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-textSecondary">
                    #{idx + 1}
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {ms.title}
                  </h4>
                  {getStatusBadge(ms.status)}
                </div>
                <p className="text-sm text-textSecondary leading-relaxed max-w-xl">
                  {ms.description}
                </p>
                {ms.clientFeedback && (
                  <div className="mt-2 p-2.5 rounded-lg bg-navyLight border border-surfaceLight text-xs text-slate-300 italic">
                    &ldquo;{ms.clientFeedback}&rdquo;
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-end justify-between shrink-0 gap-2">
                <span className="text-lg font-bold font-mono text-white">
                  {formatCurrency(ms.amount, currency)}
                </span>
                <span className="text-xs text-textSecondary">
                  Due: {new Date(ms.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            {showActions && (
              <div className="mt-4 pt-3 border-t border-surfaceLight/60 flex items-center justify-between gap-3">
                <div className="text-xs text-textSecondary">
                  {ms.verificationToken && (
                    <span className="font-mono text-[11px] text-textSecondary/80">
                      Token: {ms.verificationToken}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {ms.status !== "confirmed" && ms.status !== "delivered" && onDeliver && (
                    <Button
                      size="sm"
                      variant="electric"
                      onClick={() => onDeliver(ms.id)}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mark Delivered & Email Client</span>
                    </Button>
                  )}

                  {ms.status === "delivered" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 gap-1.5 text-xs border-surfaceLight"
                      >
                        <a
                          href={`/verify/${ms.verificationToken}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>Open Client Verification Link</span>
                          <ExternalLink className="w-3 h-3 text-electric" />
                        </a>
                      </Button>
                      {onConfirm && (
                        <Button
                          size="sm"
                          variant="electric"
                          onClick={() => onConfirm(ms.id)}
                          className="h-8 gap-1 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Simulate Client Sign-off</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-electric">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Delivery Signed & Archived</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
