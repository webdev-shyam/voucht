"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, maskClientName } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const projects = useAppStore((state) => state.projects);
  const user = useAppStore((state) => state.user);
  const deliverMilestone = useAppStore((state) => state.deliverMilestone);
  const confirmMilestone = useAppStore((state) => state.confirmMilestone);
  const completeProject = useAppStore((state) => state.completeProject);
  const cancelProject = useAppStore((state) => state.cancelProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const logActivity = useAppStore((state) => state.logActivity);

  const [resendingEmail, setResendingEmail] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [completing, setCompleting] = useState(false);

  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
        <p className="text-sm text-textSecondary mb-6">
          The requested project does not exist or has been removed.
        </p>
        <Button asChild variant="electric" size="sm">
          <Link href="/dashboard/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const milestones = project.milestones || [];
  const confirmedCount = milestones.filter((m) => m.status === "confirmed").length;
  const allMilestonesConfirmed =
    milestones.length > 0 && confirmedCount === milestones.length;

  // Deadline calculation
  const deadlineDate = new Date(project.deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = diffDays < 0 && project.status !== "completed";
  const deadlineCountdown = isOverdue
    ? `Overdue by ${Math.abs(diffDays)} days`
    : diffDays === 0
    ? "Due today"
    : `${diffDays} days remaining`;

  // Resend kickoff / project confirmation email
  const handleResendKickoffEmail = async () => {
    setResendingEmail(true);
    try {
      await fetch("/api/email/send-client-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: project.clientEmail,
          clientName: project.clientName,
          freelancerName: user.fullName,
          projectTitle: project.title,
          milestoneTitle: milestones[0]?.title || "Project Confirmation",
          token: milestones[0]?.verificationToken || "token-resend",
        }),
      });

      toast({
        title: "Confirmation link resent!",
        description: `Dispatched client verification email to ${project.clientEmail}`,
      });
    } catch (e) {
      toast({
        title: "Email dispatch failed",
        description: "Could not send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Mark as Complete button for milestone
  const handleMarkMilestoneComplete = async (milestoneId: string, milestoneTitle: string, dueDate: string) => {
    deliverMilestone(project.id, milestoneId);

    const isSubmittedOnTime = new Date().getTime() <= new Date(dueDate).getTime();

    // Call server email trigger endpoint
    try {
      const ms = milestones.find((m) => m.id === milestoneId);
      await fetch("/api/email/send-client-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: project.clientEmail,
          clientName: project.clientName,
          freelancerName: user.fullName,
          milestoneTitle: milestoneTitle,
          projectTitle: project.title,
          token: ms?.verificationToken || `tok_${milestoneId}`,
        }),
      });
    } catch (e) {
      console.warn("Client email notify warning:", e);
    }

    logActivity({
      title: `Submitted milestone '${milestoneTitle}'`,
      description: `Delivery submitted ${isSubmittedOnTime ? "on-time" : "past due date"}. Awaiting client confirmation.`,
      type: "milestone_delivered",
    });

    toast({
      title: "Milestone Submitted! 📦",
      description: `Client verification request sent to ${project.clientEmail}.`,
    });
  };

  // Optional quick test trigger: Client confirms milestone directly from dashboard for preview testing
  const handleQuickClientSignOff = (milestoneId: string, title: string) => {
    confirmMilestone(project.id, milestoneId, "Verified delivery quality.");
    toast({
      title: `Milestone Confirmed! ✅`,
      description: `Client confirmation for "${title}" recorded in the proof ledger.`,
    });
  };

  // Bottom action: Complete Project
  const handleCompleteProject = () => {
    setCompleting(true);

    // Trigger canvas confetti celebration
    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#00ff88", "#38bdf8", "#fbbf24", "#a855f7"],
      });
    } catch (confettiErr) {
      console.warn("Confetti error:", confettiErr);
    }

    completeProject(project.id);

    toast({
      title: "Project Completed! 🎉",
      description: `Project "${project.title}" has been successfully completed and sealed in your Trust Score.`,
    });

    setTimeout(() => {
      setCompleting(false);
    }, 800);
  };

  // Bottom action: Cancel Project
  const handleCancelProject = () => {
    cancelProject(project.id);
    setShowCancelDialog(false);
    toast({
      title: "Project Cancelled",
      description: "Project status updated to cancelled. Trust Score has been recalibrated.",
      variant: "destructive",
    });
    router.push("/dashboard/projects");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-textSecondary">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
          <Link href="/dashboard/projects">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Projects</span>
          </Link>
        </Button>
        <span>/</span>
        <span className="text-white truncate max-w-sm font-semibold">
          {project.title}
        </span>
      </div>

      {/* ================= TOP SECTION — Project Header ================= */}
      <Card className="border-surfaceLight bg-surface shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                {project.status === "completed" ? (
                  <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs py-0.5 px-2.5 font-mono uppercase">
                    COMPLETED
                  </Badge>
                ) : project.status === "disputed" ? (
                  <Badge variant="destructive" className="text-xs py-0.5 px-2.5 font-mono uppercase">
                    CANCELLED
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="destructive" className="text-xs py-0.5 px-2.5 font-mono uppercase">
                    OVERDUE
                  </Badge>
                ) : (
                  <Badge variant="electric" className="text-xs py-0.5 px-2.5 font-mono uppercase">
                    ACTIVE
                  </Badge>
                )}

                <span className="text-xs text-textSecondary font-mono">
                  ID: {project.id}
                </span>

                {/* Client confirmed status badge */}
                {project.clientConfirmed ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✅ Confirmed by Client</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>⏳ Waiting for confirmation</span>
                    </span>
                    <button
                      onClick={handleResendKickoffEmail}
                      disabled={resendingEmail}
                      className="text-[11px] text-electric hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendingEmail ? "animate-spin" : ""}`} />
                      <span>Resend email</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Large Project Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {project.title}
              </h1>

              {/* Client & Deadline Metadata Row */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-textSecondary pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-electric" />
                  <span>
                    Client: <strong className="text-slate-200">{project.clientName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-electric" />
                  <span className="text-slate-300 font-mono">{project.clientEmail}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-electric" />
                  <span>Due {deadlineDate.toLocaleDateString()}</span>
                  <span
                    className={`font-semibold ml-1 px-1.5 py-0.5 rounded ${
                      isOverdue
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-navyLight text-electric"
                    }`}
                  >
                    ({deadlineCountdown})
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Amount and Verified Milestones Card */}
            <div className="flex items-center gap-6 lg:border-l lg:border-surfaceLight lg:pl-6 shrink-0 bg-navyLight/40 lg:bg-transparent p-4 lg:p-0 rounded-xl border lg:border-0 border-surfaceLight">
              <div>
                <span className="text-xs text-textSecondary block font-medium">Payment Amount</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-electric">
                  {formatCurrency(project.totalBudget, project.currency)}
                </span>
              </div>
              <div className="border-l border-surfaceLight pl-6">
                <span className="text-xs text-textSecondary block font-medium">Milestones</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {confirmedCount}/{milestones.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= MIDDLE SECTION — Milestone Timeline ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-electric" />
              <span>Milestone Timeline</span>
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Sequential deliverables. Submitting milestone delivers proof verification to client.
            </p>
          </div>
        </div>

        {/* Visual Timeline (Vertical line with status dots) */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-surfaceLight">
          {milestones.map((m, idx) => {
            const dueDateObj = new Date(m.dueDate);
            const isMsOverdue =
              m.status !== "confirmed" &&
              dueDateObj.getTime() < now.getTime();

            // Circle state
            // ✅ green (confirmed), 🟡 yellow (submitted/pending), ⚪ gray (future), 🔴 red (overdue)
            let circleColorClass = "bg-surfaceLight border-surfaceLight text-textSecondary"; // ⚪
            let circleIcon = <span className="text-xs font-mono font-bold">{idx + 1}</span>;

            if (m.status === "confirmed") {
              circleColorClass = "bg-emerald-500/20 border-[#00ff88] text-[#00ff88] shadow-sm"; // ✅ green
              circleIcon = <Check className="w-3.5 h-3.5 stroke-[3]" />;
            } else if (isMsOverdue) {
              circleColorClass = "bg-red-500/20 border-red-500 text-red-400"; // 🔴 red
              circleIcon = <AlertCircle className="w-3.5 h-3.5" />;
            } else if (m.status === "delivered") {
              circleColorClass = "bg-amber-500/20 border-amber-400 text-amber-400 animate-pulse"; // 🟡 yellow
              circleIcon = <Clock className="w-3.5 h-3.5" />;
            } else if (idx === 0 || milestones[idx - 1]?.status === "confirmed") {
              circleColorClass = "bg-navyLight border-electric text-electric";
            }

            return (
              <div key={m.id} className="relative group">
                {/* Timeline node circle */}
                <div
                  className={`absolute -left-[30px] sm:-left-[38px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${circleColorClass}`}
                >
                  {circleIcon}
                </div>

                {/* Milestone Card */}
                <Card className="border-surfaceLight bg-surface hover:border-surfaceLight/80 transition-colors shadow-sm">
                  <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-textSecondary">
                          Milestone {idx + 1}
                        </span>

                        {m.status === "confirmed" ? (
                          <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-2 font-mono">
                            VERIFIED
                          </Badge>
                        ) : m.status === "delivered" ? (
                          <Badge variant="secondary" className="text-amber-400 border border-amber-500/30 bg-amber-500/10 text-[10px] py-0 px-2 font-mono">
                            SUBMITTED / PENDING CLIENT
                          </Badge>
                        ) : isMsOverdue ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-2 font-mono">
                            OVERDUE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-surfaceLight text-textSecondary text-[10px] py-0 px-2 font-mono">
                            PENDING
                          </Badge>
                        )}

                        {m.amount ? (
                          <span className="text-xs font-mono font-bold text-electric ml-1">
                            {formatCurrency(m.amount, project.currency)}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {m.title}
                      </h4>

                      {m.description && (
                        <p className="text-xs text-textSecondary max-w-xl">
                          {m.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs pt-1">
                        <span className="text-textSecondary font-mono">
                          Due Date: {dueDateObj.toLocaleDateString()}
                        </span>

                        {isMsOverdue && (
                          <span className="text-red-400 font-bold flex items-center gap-1 font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Overdue deadline</span>
                          </span>
                        )}

                        {m.confirmedAt && (
                          <span className="text-emerald-400 font-mono text-[11px]">
                            Signed off on {new Date(m.confirmedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Milestone Actions */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      {m.status === "confirmed" ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 px-3 py-1.5 rounded-lg border border-[#00ff88]/20 font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Client Confirmed ✓</span>
                        </div>
                      ) : m.status === "delivered" ? (
                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Submitted & Sent</span>
                          </span>
                          <button
                            onClick={() => handleQuickClientSignOff(m.id, m.title)}
                            className="text-[11px] text-electric hover:underline text-left sm:text-right"
                            title="Simulate client approving verification link"
                          >
                            Simulate client sign-off (Demo) →
                          </button>
                        </div>
                      ) : (
                        /* "Mark as Complete" button (if pending/in_progress) */
                        <Button
                          size="sm"
                          variant="electric"
                          className="font-bold text-xs gap-1.5 h-9"
                          onClick={() => handleMarkMilestoneComplete(m.id, m.title, m.dueDate)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Mark as Complete</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= BOTTOM SECTION — Actions ================= */}
      <Card className="border-surfaceLight bg-surface shadow-xl">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Project Actions</h4>
            <p className="text-xs text-textSecondary mt-0.5">
              {allMilestonesConfirmed
                ? "All milestones are cryptographically signed off by your client! Ready to seal completion."
                : "Deliver and confirm all milestones above to enable project completion."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Cancel Project button (outline, danger) */}
            {project.status !== "completed" && project.status !== "disputed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-semibold gap-1.5 h-9"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Project</span>
              </Button>
            )}

            {/* Complete Project button (only if all milestones are confirmed) */}
            {project.status === "completed" ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Project Fully Completed & Sealed</span>
              </div>
            ) : (
              <Button
                disabled={!allMilestonesConfirmed || completing}
                variant="electric"
                size="sm"
                onClick={handleCompleteProject}
                className="font-bold text-xs gap-2 h-9 px-5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>{completing ? "Sealing Project..." : "Complete Project 🎉"}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Project Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-red-500/30 bg-surface text-white sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Cancel Project Engagement?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-300 pt-1">
              Cancelling affects your Trust Score. Ghost rate will increase and your on-time score will be penalized.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1">
            <p className="font-semibold">⚠️ Reputational Warning:</p>
            <p>
              Voucht records unfulfilled client deliverables on the public trust ledger. Only cancel if both parties have agreed to mutually terminate.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-surfaceLight text-textSecondary text-xs"
            >
              Nevermind, keep project
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelProject}
              className="text-xs font-bold"
            >
              Yes, Cancel Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
