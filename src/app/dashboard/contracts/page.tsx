"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, FileText, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, canAccess } from "@/lib/utils";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import type { Contract } from "@/lib/types";

export default function ContractsPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const contracts = useAppStore((state) => state.contracts);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewing, setViewing] = useState<Contract | null>(null);

  const hasAccess = canAccess(user?.tier, "smart_contracts");

  const handleGenerateClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault();
      setShowUpgradeModal(true);
      return;
    }
    router.push("/dashboard/contracts/new");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-electric" />
            <span>AI Smart Contracts</span>
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Draft a service agreement for a project — scope, payment terms, IP and termination in one
            document. Read every draft and edit it before you send it; these are starting points, not
            legal advice.
          </p>
        </div>

        <Button
          onClick={handleGenerateClick}
          variant="electric"
          size="sm"
          className="gap-1.5 font-bold text-xs"
        >
          {hasAccess ? (
            <Sparkles className="w-4 h-4 text-navy" />
          ) : (
            <Lock className="w-4 h-4 text-navy" />
          )}
          <span>Generate Contract with AI</span>
        </Button>
      </div>

      {/* Upgrade Banner for Free tier */}
      {!hasAccess && (
        <Card className="border border-electric/30 bg-gradient-to-r from-surface to-navyLight relative overflow-hidden">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-electric text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pro &amp; Elite feature</span>
              </div>
              <h4 className="text-base font-bold text-white">
                Draft client agreements with built-in verification clauses
              </h4>
              <p className="text-xs text-textSecondary max-w-xl">
                The Free plan does not include contract drafting. Pro and Elite generate unlimited
                drafts for your own projects.
              </p>
            </div>

            <Button
              onClick={() => setShowUpgradeModal(true)}
              variant="electric"
              size="sm"
              className="shrink-0 font-bold h-9 shadow-md text-xs"
            >
              <span>Unlock AI Contracts →</span>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {contracts.map((c) => (
          <Card key={c.id} className="border-surfaceLight bg-surface">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "signed" ? "electric" : "outline"} className="text-[10px] uppercase">
                    {c.status}
                  </Badge>
                  {c.generatedByAi && (
                    <span className="text-xs text-electric flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Generated
                    </span>
                  )}
                  <span className="text-xs text-textSecondary font-mono">&bull; {c.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {c.title}
                </h3>
                <p className="text-xs text-textSecondary">
                  Client: <strong className="text-slate-200">{c.clientName}</strong> ({c.clientEmail})
                </p>
                <p className="text-xs text-textSecondary/80 pt-1 line-clamp-2">
                  {c.scopeOfWork}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    {formatCurrency(c.totalValue, c.currency)}
                  </div>
                  <div className="text-[11px] text-textSecondary">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-surfaceLight text-xs"
                  onClick={() => setViewing(c)}
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-electric" /> View Agreement
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {contracts.length === 0 && (
          <div className="text-center py-12 border border-dashed border-surfaceLight rounded-xl bg-surface/30">
            <FileText className="w-10 h-10 text-textSecondary mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No contracts created yet</h3>
            <p className="text-xs text-textSecondary mt-1 max-w-sm mx-auto">
              Draft a service agreement for a project and keep the scope, payment terms and IP
              transfer in one place.
            </p>
          </div>
        )}
      </div>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-surfaceLight bg-surface">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{viewing.title}</DialogTitle>
                <DialogDescription className="text-textSecondary">
                  Stored draft for {viewing.clientName} ({viewing.clientEmail}) —{" "}
                  {formatCurrency(viewing.totalValue, viewing.currency)} ·{" "}
                  {viewing.generatedByAi ? "AI-assisted draft" : "template draft"} ·{" "}
                  {new Date(viewing.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap text-sm">
                {viewing.contractText || viewing.scopeOfWork}
              </div>

              <p className="text-xs text-textSecondary border-t border-surfaceLight pt-4">
                This is a draft you can edit and send. It is not legal advice, and Voucht does not
                review, countersign or guarantee that any agreement is enforceable.
              </p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="smart_contracts"
      />
    </div>
  );
}
