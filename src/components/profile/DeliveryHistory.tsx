import { CheckCircle2, Shield, Calendar } from "lucide-react";
import { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface DeliveryHistoryProps {
  projects: Project[];
}

export function DeliveryHistory({ projects }: DeliveryHistoryProps) {
  const allMilestones = projects.flatMap((p) =>
    p.milestones.map((m) => ({
      ...m,
      projectTitle: p.title,
      clientName: p.clientName,
      currency: p.currency,
    }))
  );

  const confirmedDeliveries = allMilestones.filter((m) => m.status === "confirmed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-electric" />
          <span>Verified Milestone Deliveries ({confirmedDeliveries.length})</span>
        </h3>
        <span className="text-xs text-textSecondary">
          Public Proof Ledger
        </span>
      </div>

      <div className="space-y-3">
        {confirmedDeliveries.map((m, idx) => (
          <div
            key={m.id || idx}
            className="p-5 rounded-xl border border-surfaceLight bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-navyMid text-slate-300">
                  {m.projectTitle}
                </span>
                <span className="text-xs text-textSecondary">&bull; Client: {m.clientName}</span>
              </div>
              <h4 className="text-base font-bold text-white">
                {m.title}
              </h4>
              <p className="text-xs text-textSecondary max-w-xl">
                {m.description}
              </p>
              {m.clientFeedback && (
                <p className="text-xs text-electric/90 italic pt-1">
                  &ldquo;{m.clientFeedback}&rdquo;
                </p>
              )}
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-end shrink-0 gap-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-surfaceLight">
              <span className="text-sm font-bold font-mono text-white">
                {formatCurrency(m.amount, m.currency)}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-electric">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Signed {m.confirmedAt ? new Date(m.confirmedAt).toLocaleDateString() : "Verified"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
