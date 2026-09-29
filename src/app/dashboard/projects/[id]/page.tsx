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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const status = useAppStore((state) => state.status);
  const projects = useAppStore((state) => state.projects);
  const user = useAppStore((state) => state.user);
  const submitDelivery = useAppStore((state) => state.submitDelivery);
  const sendVerificationRequest = useAppStore((state) => state.sendVerificationRequest);
  const setProjectStatus = useAppStore((state) => state.setProjectStatus);
  const addMilestone = useAppStore((state) => state.addMilestone);

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneDraft, setMilestoneDraft] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    if (status === "loading" || status === "idle") {
      return <div className="h-64 rounded-2xl bg-surface/60 animate-pulse" />;
    }
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Project not found</h2>
        <p className="text-sm text-textSecondary mb-6">
          This project is not in your account. It may have been removed, or you
          may be signed in with a different email.
        </p>
        <Button asChild variant="electric" size="sm">
          <Link href="/dashboard/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  if (!user) return null;

  const milestones = project.milestones || [];
  const confirmedCount = milestones.filter((m) => m.status === "confirmed").length;
  const allMilestonesConfirmed =
    milestones.length > 0 && confirmedCount === milestones.length;
  const pendingDelivery = milestones.find((m) => m.verificationStatus === "pending");

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

  // Re-send the verification link for an already-submitted delivery. The link
  // and its recipient come from the delivery row, not from this request body.
  const handleResendVerification = async (milestoneId: string) => {
    setResendingId(milestoneId);
    const result = await sendVerificationRequest(project.id, milestoneId);
    setResendingId(null);

    if (result.sent) {
      toast({
        title: "Verification link sent",
        description: `Confirmation email dispatched to ${project.clientEmail}.`,
      });
    } else {
      toast({
        title: "Email not sent",
        description:
          result.reason === "no-delivery"
            ? "Submit this delivery first; a verification link only exists after a delivery is recorded."
            : "We couldn't send the email right now. Try again in a moment.",
        variant: "destructive",
      });
    }
  };

  // Records the delivery (the database mints its verification token), then asks
  // the server to email the client's confirmation link.
  const handleMarkMilestoneComplete = async (milestoneId: string, milestoneTitle: string) => {
    setSubmittingId(milestoneId);
    const delivery = await submitDelivery(project.id, milestoneId);
    setSubmittingId(null);

    if (!delivery) {
      toast({
        title: "Delivery not recorded",
        description: "We couldn't save this submission. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const email = await sendVerificationRequest(project.id, milestoneId);
    toast({
      title: `Submitted "${milestoneTitle}"`,
      description: email.sent
        ? `Verification link emailed to ${project.clientEmail}.`
        : "Recorded. Use “Send verification link” to email the client — the email did not go out automatically.",
      variant: email.sent ? "default" : "destructive",
    });
  };

  // Adds a milestone to a project that already exists. The store writes the row
  // and reloads, so the timeline shows it only once the insert succeeded.
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = milestoneDraft.title.trim();
    if (title.length < 2) {
      toast({
        title: "Name the milestone",
        description: "Give it a short title, such as \"Design handoff\".",
        variant: "destructive",
      });
      return;
    }

    if (!milestoneDraft.dueDate) {
      toast({
        title: "Pick a deadline",
        description: "The deadline is what the on-time factor compares against.",
        variant: "destructive",
      });
      return;
    }

    setSavingMilestone(true);
    let saved = false;
    try {
      saved = await addMilestone(project.id, {
        title,
        description: milestoneDraft.description.trim() || undefined,
        dueDate: milestoneDraft.dueDate,
        sortOrder: milestones.length,
      });
    } catch {
      saved = false;
    }
    setSavingMilestone(false);

    if (!saved) {
      toast({
        title: "Milestone not added",
        description: "We couldn't save it. Nothing was added to this project.",
        variant: "destructive",
      });
      return;
    }

    setMilestoneDraft({ title: "", description: "", dueDate: "" });
    setShowAddMilestone(false);
    toast({
      title: "Milestone added",
      description: `"${title}" is now in the timeline.`,
      variant: "success",
    });
  };

  // Bottom action: Complete Project
  const handleCompleteProject = async () => {
    setCompleting(true);

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

    await setProjectStatus(project.id, "completed");
    setCompleting(false);

    toast({
      title: "Project completed",
      description: `"${project.title}" is archived and counted in your Trust Score.`,
    });
  };

  // Bottom action: Cancel Project
  const handleCancelProject = async () => {
    setShowCancelDialog(false);
    await setProjectStatus(project.id, "cancelled");
    toast({
      title: "Project cancelled",
      description: "Status set to cancelled. Your Trust Score is recalculated.",
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
                ) : project.status === "cancelled" ? (
                  <Badge variant="destructive" className="text-xs py-0.5 px-2.5 font-mono uppercase">
                    CANCELLED
                  </Badge>
                ) : project.status === "disputed" ? (
                  <Badge variant="destructive" className="text-xs py-0.5 px-2.5 font-mono uppercase">
                    DISPUTED
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

                {/* Client verification status for the delivery in flight */}
                {project.clientConfirmed ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmed by client</span>
                  </span>
                ) : pendingDelivery ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Awaiting client verification</span>
                    </span>
                    <button
                      onClick={() => handleResendVerification(pendingDelivery.id)}
                      disabled={resendingId === pendingDelivery.id}
                      className="text-[11px] text-electric hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          resendingId === pendingDelivery.id ? "animate-spin" : ""
                        }`}
                      />
                      <span>Resend link</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-textSecondary bg-navyLight px-2.5 py-0.5 rounded-full border border-surfaceLight">
                    No delivery submitted yet
                  </span>
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
              Sequential deliverables. Submitting a delivery sends your client a
              one-time verification link; their confirmation is what counts toward
              your Trust Score.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-surfaceLight shrink-0"
            onClick={() => setShowAddMilestone(true)}
            disabled={
              project.status === "completed" || project.status === "cancelled"
            }
          >
            <Plus className="w-4 h-4" />
            <span>Add milestone</span>
          </Button>
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
                          <span>Client confirmed</span>
                        </div>
                      ) : m.status === "disputed" ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 font-mono">
                          <AlertCircle className="w-4 h-4" />
                          <span>Client disputed</span>
                        </div>
                      ) : m.verificationStatus === "pending" ? (
                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Submitted, awaiting client</span>
                          </span>
                          <button
                            onClick={() => handleResendVerification(m.id)}
                            disabled={resendingId === m.id}
                            className="text-[11px] text-electric hover:underline text-left sm:text-right"
                          >
                            {resendingId === m.id ? "Sending…" : "Resend verification link →"}
                          </button>
                        </div>
                      ) : (
                        /* "Submit delivery" button (pending / in progress) */
                        <Button
                          size="sm"
                          variant="electric"
                          className="font-bold text-xs gap-1.5 h-9"
                          disabled={submittingId === m.id}
                          onClick={() => handleMarkMilestoneComplete(m.id, m.title)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{submittingId === m.id ? "Submitting…" : "Submit delivery"}</span>
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
                ? "Every milestone is confirmed by your client. Completing the project adds it to your finished work."
                : "Submit and have each milestone confirmed above to enable project completion."}
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
                <span>Completed & counted</span>
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
                <span>{completing ? "Completing…" : "Complete project"}</span>
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
              A cancelled project lowers the &ldquo;no cancelled work&rdquo; part
              of your Trust Score (20 of 100 points). Confirmed deliveries stay on
              your account either way.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1">
            <p className="font-semibold">Before you cancel:</p>
            <p>
              Cancel only when you and the client have agreed to end the
              engagement. A cancelled project is never shown as a verified
              delivery on your public page.
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
      {/* Add Milestone Dialog */}
      <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
        <DialogContent className="border-surfaceLight bg-surface text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Add a milestone
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-300 pt-1">
              It appears in the timeline as pending. A milestone only counts
              towards your Trust Score after your client confirms its delivery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMilestone} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="ms-title" className="text-xs font-semibold text-white">
                Milestone title
              </Label>
              <Input
                id="ms-title"
                value={milestoneDraft.title}
                onChange={(e) =>
                  setMilestoneDraft((d) => ({ ...d, title: e.target.value }))
                }
                placeholder="Design handoff"
                maxLength={80}
                className="h-10 bg-navyLight border-surfaceLight text-white text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ms-due" className="text-xs font-semibold text-white">
                Deadline
              </Label>
              <Input
                id="ms-due"
                type="date"
                value={milestoneDraft.dueDate}
                onChange={(e) =>
                  setMilestoneDraft((d) => ({ ...d, dueDate: e.target.value }))
                }
                className="h-10 bg-navyLight border-surfaceLight text-white text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ms-desc" className="text-xs font-semibold text-white">
                What counts as done? <span className="text-textSecondary font-normal">(optional)</span>
              </Label>
              <Input
                id="ms-desc"
                value={milestoneDraft.description}
                onChange={(e) =>
                  setMilestoneDraft((d) => ({ ...d, description: e.target.value }))
                }
                placeholder="Figma file handed over, all screens covered"
                maxLength={160}
                className="h-10 bg-navyLight border-surfaceLight text-white text-sm"
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddMilestone(false)}
                className="border-surfaceLight text-textSecondary text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="electric"
                disabled={savingMilestone}
                className="text-xs font-bold"
              >
                {savingMilestone ? "Saving…" : "Add milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
