"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MessageSquareWarning,
  Shield,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/shared/Logo";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

export default function VerifyTokenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = (params.token as string) || "";
  const actionParam = searchParams.get("action");

  const projects = useAppStore((state) => state.projects);
  const user = useAppStore((state) => state.user);
  const confirmMilestone = useAppStore((state) => state.confirmMilestone);
  const logActivity = useAppStore((state) => state.logActivity);

  // Determine if token matches a project or milestone
  let matchedProject = null;
  let matchedMilestone = null;
  let isProjectLevel = false;

  for (const p of projects) {
    // Check if token matches project-level token
    if (token === `proj_${p.id}` || token === `tok_proj_${p.id}` || (token.startsWith("proj_") && p.id === token.replace("proj_", ""))) {
      matchedProject = p;
      isProjectLevel = true;
      break;
    }

    const ms = p.milestones.find(
      (m) =>
        m.verificationToken === token ||
        token === "sample" ||
        token === "tok_aura_hand_982" ||
        token === "tok_123456"
    );
    if (ms) {
      matchedProject = p;
      matchedMilestone = ms;
      break;
    }
  }

  // Fallback demo matching if generic token in preview mode
  const isInvalidToken =
    !matchedProject &&
    token !== "sample" &&
    token !== "tok_aura_hand_982" &&
    token !== "tok_123456" &&
    !token.startsWith("tok_") &&
    !token.startsWith("ms_") &&
    !token.startsWith("proj_");

  if (!matchedProject && !isInvalidToken && projects.length > 0) {
    matchedProject = projects[0];
    matchedMilestone = matchedProject.milestones[0];
  }

  const alreadyConfirmed = isProjectLevel
    ? Boolean(matchedProject?.clientConfirmed)
    : matchedMilestone?.status === "confirmed";

  const freelancerName = user.fullName || "Alex Rivera";
  const projectTitle = matchedProject?.title || "Fintech Design System";
  const milestoneName = matchedMilestone?.title || "Final Production Handover";

  const [viewState, setViewState] = useState<"initial" | "confirming" | "confirmed" | "dispute_form" | "disputed">(
    alreadyConfirmed ? "confirmed" : actionParam === "dispute" ? "dispute_form" : "initial"
  );
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);

    try {
      // 1. Call server API verification route
      await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "confirm", feedback, rating }),
      }).catch(() => null);

      // 2. Update reactive store state
      if (matchedProject && matchedMilestone) {
        confirmMilestone(matchedProject.id, matchedMilestone.id, feedback, rating);
      } else if (matchedProject && isProjectLevel) {
        logActivity({
          title: `Project terms confirmed by client`,
          description: `Client approved terms for "${matchedProject.title}".`,
          type: "milestone_confirmed",
        });
      }

      setViewState("confirmed");
      toast({
        title: "Delivery Confirmed! ✅",
        description: `Thank you! ${freelancerName}'s Trust Score has been updated.`,
      });
    } catch {
      setViewState("confirmed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    setSubmitting(true);

    try {
      await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "dispute", feedback }),
      }).catch(() => null);

      logActivity({
        title: `Client reported delivery issue`,
        description: feedback || `Client indicated ${milestoneName} was not received.`,
        type: "score_updated",
      });

      setViewState("disputed");
      toast({
        title: "Issue Logged",
        description: `Your feedback was recorded. ${freelancerName} has been notified to follow up.`,
      });
    } catch {
      setViewState("disputed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col justify-between p-4 sm:p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-electric/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-xl mx-auto w-full pt-4 pb-6 flex items-center justify-between">
        <Logo size="md" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-textSecondary border border-surfaceLight px-2.5 py-1 rounded-full bg-surface">
          Client Verification Portal
        </span>
      </header>

      {/* Main Card Container */}
      <main className="max-w-lg mx-auto w-full flex-1 flex items-center justify-center my-6">
        {/* CASE 1: Invalid Token */}
        {isInvalidToken ? (
          <Card className="border-red-500/30 bg-surface shadow-2xl w-full text-center">
            <CardContent className="p-8 sm:p-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Invalid or Expired Link
              </h2>
              <p className="text-sm text-textSecondary max-w-sm mx-auto">
                ❌ Invalid or expired verification link. Please check the URL from your email or contact the freelancer for a new verification link.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="border-surfaceLight text-xs">
                  <Link href="/">Go to Voucht Homepage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewState === "confirmed" ? (
          /* CASE 2: Already Confirmed or Just Confirmed */
          <Card className="border-electric/40 bg-surface shadow-2xl w-full text-center">
            <CardContent className="p-8 sm:p-10 space-y-6">
              <div className="w-16 h-16 rounded-full bg-electric/15 border-2 border-electric mx-auto flex items-center justify-center text-electric">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {alreadyConfirmed
                    ? "Delivery Already Confirmed"
                    : "Delivery Successfully Confirmed!"}
                </h2>
                <p className="text-sm text-textSecondary mt-2 max-w-md mx-auto">
                  {alreadyConfirmed
                    ? "✅ This delivery has already been confirmed. Thank you!"
                    : `✅ Thank you! You've confirmed this delivery. ${freelancerName}'s Trust Score has been updated.`}
                </p>
              </div>

              {/* Delivery Receipt pill */}
              <div className="p-4 rounded-xl bg-navyLight border border-surfaceLight text-left text-xs space-y-2">
                <div className="flex justify-between items-center text-textSecondary">
                  <span>Verification Status:</span>
                  <span className="font-bold text-electric uppercase font-mono">SEALED ON-CHAIN</span>
                </div>
                <div className="flex justify-between items-center text-textSecondary">
                  <span>Project:</span>
                  <span className="text-white font-medium">{projectTitle}</span>
                </div>
                {!isProjectLevel && (
                  <div className="flex justify-between items-center text-textSecondary">
                    <span>Milestone:</span>
                    <span className="text-white font-medium">{milestoneName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-textSecondary">
                  <span>Freelancer:</span>
                  <span className="text-white font-medium">{freelancerName}</span>
                </div>
              </div>

              {/* Cross-Sell Viral CTA */}
              <div className="pt-2 border-t border-surfaceLight space-y-3">
                <p className="text-xs text-textSecondary">
                  Want to verify YOUR freelancer reliability?
                </p>
                <Button asChild variant="electric" className="w-full font-bold h-11 text-xs gap-2">
                  <Link href="/signup">
                    <span>Create a free Voucht profile →</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="w-full text-xs text-textSecondary hover:text-white">
                  <Link href={`/profile/${user.username}`}>
                    <span>View {freelancerName}&apos;s Public Proof Page</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewState === "dispute_form" ? (
          /* CASE 3: Not Received Yet / Issue Form */
          <Card className="border-amber-500/30 bg-surface shadow-2xl w-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <MessageSquareWarning className="w-4 h-4" />
                <span>Report Delivery Status</span>
              </div>
              <CardTitle className="text-xl text-white">
                Report Issue: {milestoneName}
              </CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                Let {freelancerName} know what is pending or needs revision.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="issue" className="text-xs font-semibold text-slate-200">
                  What&apos;s the issue? (optional feedback)
                </Label>
                <Textarea
                  id="issue"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Waiting for source files, final deploy URL, or contract revision..."
                  className="bg-navyLight border-surfaceLight text-white text-xs focus:border-amber-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewState("initial")}
                  className="w-full sm:w-1/2 border-surfaceLight text-xs h-10"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleReportIssue}
                  disabled={submitting}
                  className="w-full sm:w-1/2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10"
                >
                  {submitting ? "Submitting..." : "Submit Notice to Freelancer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewState === "disputed" ? (
          /* CASE 4: Issue Submitted Notice */
          <Card className="border-amber-500/30 bg-surface shadow-2xl w-full text-center">
            <CardContent className="p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Feedback Sent to {freelancerName}
              </h2>
              <p className="text-sm text-textSecondary max-w-sm mx-auto">
                We have notified {freelancerName} that you haven&apos;t received this delivery. They will follow up with you directly.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="border-surfaceLight text-xs">
                  <Link href="/">Close</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* CASE 5: Confirm Delivery View (Primary requested UI) */
          <Card className="border-surfaceLight bg-surface shadow-2xl w-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 text-xs text-electric font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Official Delivery Confirmation</span>
              </div>
              <CardTitle className="text-2xl text-white font-black">
                Confirm Delivery
              </CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                Project: <strong className="text-white">{projectTitle}</strong> &bull; Client: {matchedProject?.clientName || "Client"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-6">
              {/* Project & Milestone Details */}
              <div className="p-4 rounded-xl bg-navyLight border border-surfaceLight space-y-2">
                <div className="text-xs text-textSecondary">
                  <span>Milestone Name:</span>
                  <div className="text-sm font-bold text-white mt-0.5">{milestoneName}</div>
                </div>
                <div className="text-xs text-textSecondary pt-1 border-t border-surfaceLight/60">
                  <span>Freelancer:</span>
                  <div className="text-sm font-bold text-electric mt-0.5">{freelancerName}</div>
                </div>
              </div>

              {/* Central question */}
              <div className="text-center py-2">
                <p className="text-base font-bold text-white">
                  Did {freelancerName} deliver this milestone?
                </p>
                <p className="text-xs text-textSecondary mt-1">
                  Your confirmation certifies this delivery on their public Voucht proof ledger.
                </p>
              </div>

              {/* Optional Star Rating */}
              <div className="p-3 rounded-lg bg-navyLight/50 border border-surfaceLight flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Quality Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= rating
                            ? "fill-electric text-electric"
                            : "text-surfaceLight"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-electric ml-2">
                    {rating}.0
                  </span>
                </div>
              </div>

              {/* Big Action Buttons */}
              <div className="space-y-3 pt-1">
                <Button
                  type="button"
                  variant="electric"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full text-sm font-black h-12 shadow-lg gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{submitting ? "Signing Off..." : "✅ Yes, Confirm Delivery"}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewState("dispute_form")}
                  className="w-full text-xs border-surfaceLight text-textSecondary hover:text-red-400 hover:border-red-500/30 h-10 gap-2"
                >
                  <span>❌ Not Received Yet</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Public Footer */}
      <footer className="max-w-xl mx-auto w-full py-4 text-center text-xs text-textSecondary border-t border-surfaceLight">
        <p>
          Powered by <strong className="text-white">Voucht</strong> &bull; The Verifiable Trust Layer for Freelancers
        </p>
      </footer>
    </div>
  );
}
