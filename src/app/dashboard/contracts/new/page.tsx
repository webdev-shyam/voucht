"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, FileCheck2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";
import { canAccess } from "@/lib/utils";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";

export default function NewContractPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const addContract = useAppStore((state) => state.addContract);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [formData, setFormData] = useState({
    projectTitle: "",
    clientName: "",
    clientEmail: "",
    scopeOfWork: "",
    totalBudget: "",
    currency: "USD",
    milestonesSummary: "",
  });

  const [generating, setGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);
  // Which generator produced the draft — shown in the UI so a template
  // fallback is never presented as an AI-written agreement.
  const [provider, setProvider] = useState<"gemini" | "openrouter" | "template" | null>(null);
  // The clause text the generator actually produced. Saving hardcoded strings
  // instead would show a draft that differs from the one the user reviewed.
  const [sections, setSections] = useState({
    paymentTerms: "",
    ipClause: "",
    terminationTerms: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAccess(user?.tier, "smart_contracts")) {
      setShowUpgradeModal(true);
      return;
    }
    setGenerating(true);
    setFormError(null);

    try {
      const res = await fetch("/api/ai/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          freelancerName: user?.fullName,
          totalBudget: parseFloat(formData.totalBudget) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(
          data?.upgrade
            ? "Contract drafting is part of the Pro plan."
            : data?.error || "We could not draft that contract. Please try again."
        );
        if (data?.upgrade) setShowUpgradeModal(true);
        return;
      }

      if (data.fullMarkdown) {
        setGeneratedContract(data.fullMarkdown);
        setProvider(data.provider ?? "template");
        setSections({
          paymentTerms: data.paymentTerms ?? "",
          ipClause: data.ipClause ?? "",
          terminationTerms: data.terminationTerms ?? "",
        });
        toast({
          title: "Draft ready for review",
          description:
            data.provider === "template"
              ? "Drafted from our built-in template — no AI model was available."
              : "Drafted by an AI model. Review every clause before sending it to a client.",
        });
      } else {
        setFormError("We could not draft that contract. Please try again.");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveContract = async () => {
    if (!generatedContract) return;

    try {
      const saved = await addContract({
        title: `Service Agreement — ${formData.projectTitle || "Untitled project"}`,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        contractText: generatedContract,
        scopeOfWork: formData.scopeOfWork,
        totalValue: parseFloat(formData.totalBudget) || 0,
        paymentTerms: sections.paymentTerms,
        ipClause: sections.ipClause,
        terminationTerms: sections.terminationTerms,
        generatedByAi: provider === "gemini" || provider === "openrouter",
      });

      if (!saved) {
        setFormError("We could not save this draft. Please try again.");
        return;
      }

      toast({
        title: "Draft saved",
        description: "Added to your contracts as a draft. It is not a signed agreement.",
      });

      router.push("/dashboard/contracts");
    } catch {
      setFormError("Your session has expired. Sign in again to save this draft.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-2 text-sm text-textSecondary">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
          <Link href="/dashboard/contracts">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contracts</span>
          </Link>
        </Button>
        <span>/</span>
        <span className="text-white">AI Contract Generator</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input Parameters Form */}
        <Card className="border-surfaceLight bg-surface">
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-electric" />
              <span>Agreement Parameters</span>
            </CardTitle>
            <CardDescription className="text-xs text-textSecondary">
              Describe the engagement and we draft a service agreement you can edit. The output is
              a starting point, not legal advice — have your own adviser review it before signing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label htmlFor="pTitle" className="text-white">Project Title</Label>
                <Input
                  id="pTitle"
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  placeholder="Mobile app redesign"
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cName" className="text-white">Client Company / Name</Label>
                  <Input
                    id="cName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Acme Studio Inc."
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cEmail" className="text-white">Client Email</Label>
                  <Input
                    id="cEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="ops@acmestudio.com"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="budget" className="text-white">Total Value</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                    placeholder="12000"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="curr" className="text-white">Currency</Label>
                  <Input
                    id="curr"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="scope" className="text-white">Scope of Deliverables</Label>
                <Textarea
                  id="scope"
                  rows={3}
                  value={formData.scopeOfWork}
                  onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                  placeholder="What you are responsible for delivering, and what is out of scope."
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="milestones" className="text-white">Milestone Breakdown</Label>
                <Textarea
                  id="milestones"
                  rows={3}
                  value={formData.milestonesSummary}
                  onChange={(e) => setFormData({ ...formData, milestonesSummary: e.target.value })}
                  placeholder={"1. Architecture & design\n2. Implementation\n3. QA and deployment"}
                  className="mt-1 text-xs font-mono"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="electric"
                className="w-full gap-2 mt-2"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-navy" />
                    <span>Drafting agreement...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-navy" />
                    <span>Generate draft</span>
                  </>
                )}
              </Button>

              {formError ? (
                <p className="text-xs text-red-400 font-medium">{formError}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {/* Live Contract Preview */}
        <Card className="border-surfaceLight bg-surface flex flex-col justify-between min-h-[500px]">
          <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between border-b border-surfaceLight">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-electric" />
                <span>Contract Output</span>
              </CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                {provider
                  ? provider === "template"
                    ? "Drafted from a built-in template (no AI model was reachable)."
                    : `Drafted by ${provider === "gemini" ? "Gemini" : "an AI model"}. Edit before sending.`
                  : "Markdown draft — review and edit before sending."}
              </CardDescription>
            </div>
            {generatedContract && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-surfaceLight gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(generatedContract);
                  toast({ title: "Copied contract markdown to clipboard" });
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6 flex-1 overflow-auto max-h-[500px]">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-electric" />
                <p className="text-xs text-textSecondary font-mono">
                  Drafting scope, payment terms, IP transfer and termination clauses...
                </p>
              </div>
            ) : generatedContract ? (
              <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {generatedContract}
              </div>
            ) : (
              <div className="text-center py-20 text-textSecondary text-xs">
                Fill in the agreement parameters on the left and click &ldquo;Generate draft&rdquo;
                to preview the contract text.
              </div>
            )}
          </CardContent>

          {generatedContract && (
            <div className="p-4 border-t border-surfaceLight flex justify-end gap-3 bg-navyLight/50">
              <Button
                variant="electric"
                size="sm"
                onClick={() => void handleSaveContract()}
                className="gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save as draft</span>
              </Button>
            </div>
          )}
        </Card>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="smart_contracts"
      />
    </div>
  );
}
