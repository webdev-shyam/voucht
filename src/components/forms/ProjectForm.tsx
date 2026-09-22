"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, DollarSign, FolderPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

export function ProjectForm() {
  const router = useRouter();
  const addProject = useAppStore((state) => state.addProject);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    totalBudget: "",
    currency: "USD",
    startDate: new Date().toISOString().split("T")[0],
    deadline: "",
    initialMilestoneTitle: "Initial Scope & Architecture Specs",
    initialMilestoneAmount: "",
    initialMilestoneDue: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientName || !formData.clientEmail || !formData.totalBudget) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const budget = parseFloat(formData.totalBudget) || 0;
    const initialAmount = parseFloat(formData.initialMilestoneAmount) || budget * 0.5;

    const newProject = addProject({
      title: formData.title,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientCompany: formData.clientCompany || undefined,
      totalBudget: budget,
      currency: formData.currency,
      startDate: formData.startDate,
      deadline: formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "active",
      milestones: [
        {
          id: `ms_${Date.now()}`,
          projectId: "",
          title: formData.initialMilestoneTitle,
          description: "First core milestone delivery and architectural setup.",
          amount: initialAmount,
          dueDate: formData.initialMilestoneDue || formData.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "pending",
          verificationToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
        },
      ],
    });

    toast({
      title: "Project Created",
      description: `Project "${newProject.title}" has been launched successfully.`,
      variant: "success",
    });

    router.push(`/dashboard/projects/${newProject.id}`);
  };

  return (
    <Card className="border-surfaceLight bg-surface max-w-2xl mx-auto">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-electric" />
          <span>Launch New Client Project</span>
        </CardTitle>
        <CardDescription className="text-textSecondary text-xs">
          Enter your client agreement details. Voucht will track progress and dispatch milestone confirmations.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Next.js SaaS Web App & API Redesign"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName" className="text-white">Client Contact Name *</Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Sarah Connor"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="clientEmail" className="text-white">Client Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="sarah@cyberdyne.io"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalBudget" className="text-white">Total Budget *</Label>
                <div className="relative mt-1">
                  <DollarSign className="w-4 h-4 text-textSecondary absolute left-3 top-3" />
                  <Input
                    id="totalBudget"
                    type="number"
                    placeholder="8500"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currency" className="text-white">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deadline" className="text-white">Final Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* First Milestone */}
          <div className="p-4 rounded-lg bg-navyLight border border-surfaceLight space-y-3">
            <h4 className="text-sm font-semibold text-electric">
              Milestone #1 Definition
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="msTitle" className="text-xs text-textSecondary">Milestone Title</Label>
                <Input
                  id="msTitle"
                  value={formData.initialMilestoneTitle}
                  onChange={(e) => setFormData({ ...formData, initialMilestoneTitle: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="msAmount" className="text-xs text-textSecondary">Milestone Amount ($)</Label>
                <Input
                  id="msAmount"
                  type="number"
                  placeholder="e.g. 4000"
                  value={formData.initialMilestoneAmount}
                  onChange={(e) => setFormData({ ...formData, initialMilestoneAmount: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-surfaceLight"
            >
              Cancel
            </Button>
            <Button type="submit" variant="electric" disabled={loading}>
              {loading ? "Creating..." : "Launch Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
