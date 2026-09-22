"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCheck2, FileText, Lock, Plus, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, canAccess } from "@/lib/utils";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

export default function ContractsPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const contracts = useAppStore((state) => state.contracts);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasAccess = canAccess(user.tier, "smart_contracts");

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
            Standardized freelance service agreements tied directly to verified milestone sign-offs.
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
                <span>Pro & Elite Exclusive Feature</span>
              </div>
              <h4 className="text-base font-bold text-white">
                Generate Legal Client Agreements with Built-in Verification Clauses
              </h4>
              <p className="text-xs text-textSecondary max-w-xl">
                Free plan does not include AI Smart Contracts. Upgrade to Pro for 5 contracts/month or Elite for unlimited legal agreements.
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

                <Button asChild size="sm" variant="outline" className="border-surfaceLight text-xs">
                  <Link href={`/dashboard/contracts/${c.id}`}>
                    <FileText className="w-3.5 h-3.5 mr-1 text-electric" /> View Agreement
                  </Link>
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
              Generate standardized service agreements with Gemini AI to protect your freelance scope of work.
            </p>
          </div>
        )}
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="smart_contracts"
      />
    </div>
  );
}
