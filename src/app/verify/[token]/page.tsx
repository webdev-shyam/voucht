"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareWarning,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/shared/Logo";
import { createClient } from "@/lib/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mirrors the JSONB returned by get_verification_request(). Nothing here is
// derived on the client: the database is the only source of the delivery state.
interface VerificationRequest {
  projectTitle: string;
  milestoneTitle: string | null;
  freelancerName: string;
  freelancerUsername: string;
  clientLabel: string;
  status: "pending" | "confirmed" | "disputed" | "expired" | "cancelled";
  submittedAt: string | null;
  dueDate: string | null;
  expiresAt: string | null;
  wasOnTime: boolean | null;
}

type ViewState =
  | "loading"
  | "invalid"
  | "expired"
  | "form"
  | "dispute_form"
  | "confirmed"
  | "disputed"
  | "error";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function VerifyTokenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = String(params.token || "");
  const wantsDispute = searchParams.get("action") === "dispute";

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // The URL is user-supplied; an unparseable token never reaches the database.
      if (!UUID_RE.test(token)) {
        if (!cancelled) setViewState("invalid");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_verification_request", { p_token: token });

      if (cancelled) return;

      if (error) {
        console.error("get_verification_request failed:", error.message);
        setErrorMessage("We could not load this verification request. Please try again.");
        setViewState("error");
        return;
      }

      const result = data as unknown as ({ valid?: boolean; reason?: string } & Partial<VerificationRequest>) | null;

      if (!result || result.valid === false) {
        setViewState(result?.reason === "expired" ? "expired" : "invalid");
        return;
      }

      setRequest(result as VerificationRequest);

      if (result.status === "confirmed") {
        setAlreadyResponded(true);
        setViewState("confirmed");
      } else if (result.status === "disputed") {
        setAlreadyResponded(true);
        setViewState("disputed");
      } else if (result.status === "expired" || result.status === "cancelled") {
        setViewState("expired");
      } else {
        setViewState(wantsDispute ? "dispute_form" : "form");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, wantsDispute]);

  const sendResponse = async (action: "confirm" | "dispute") => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, reason: action === "dispute" ? reason : undefined }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { success?: boolean; status?: "confirmed" | "disputed"; reason?: string; error?: string }
        | null;

      if (payload?.success && payload.status) {
        setViewState(payload.status);
        return;
      }

      // The RPC tells us why it refused; surface that instead of claiming success.
      switch (payload?.reason) {
        case "expired":
          setViewState("expired");
          return;
        case "confirmed":
          setAlreadyResponded(true);
          setViewState("confirmed");
          return;
        case "disputed":
          setAlreadyResponded(true);
          setViewState("disputed");
          return;
        case "invalid":
          setViewState("invalid");
          return;
      }

      setErrorMessage(
        payload?.error ?? "We could not record your response. Please try again."
      );
      setViewState(action === "dispute" ? "dispute_form" : "form");
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setViewState(action === "dispute" ? "dispute_form" : "form");
    } finally {
      setSubmitting(false);
    }
  };

  const freelancerName = request?.freelancerName ?? "the freelancer";
  const projectTitle = request?.projectTitle ?? "Untitled project";
  const milestoneTitle = request?.milestoneTitle;

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col justify-between p-4 sm:p-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-electric/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-xl mx-auto w-full pt-4 pb-6 flex items-center justify-between">
        <Logo size="md" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-textSecondary border border-surfaceLight px-2.5 py-1 rounded-full bg-surface">
          Client Verification
        </span>
      </header>

      <main className="max-w-lg mx-auto w-full flex-1 flex items-center justify-center my-6">
        {viewState === "loading" ? (
          <Card className="border-surfaceLight bg-surface shadow-2xl w-full">
            <CardContent className="p-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-surfaceLight mx-auto animate-pulse" />
              <div className="h-4 w-2/3 bg-surfaceLight rounded mx-auto animate-pulse" />
              <div className="h-4 w-1/2 bg-surfaceLight rounded mx-auto animate-pulse" />
            </CardContent>
          </Card>
        ) : viewState === "invalid" ? (
          <Card className="border-red-500/30 bg-surface shadow-2xl w-full text-center">
            <CardContent className="p-8 sm:p-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">This link is not valid</h2>
              <p className="text-sm text-textSecondary max-w-sm mx-auto">
                We could not find a delivery matching this link. Verification links work once
                only — ask {freelancerName} to send a new one.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="border-surfaceLight text-xs">
                  <Link href="/">Go to Voucht Homepage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewState === "expired" ? (
          <Card className="border-amber-500/30 bg-surface shadow-2xl w-full text-center">
            <CardContent className="p-8 sm:p-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
                <Clock3 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">This link has expired</h2>
              <p className="text-sm text-textSecondary max-w-sm mx-auto">
                Verification links are valid for 30 days from the delivery date.
                {request ? ` This one expired on ${formatDate(request.expiresAt)}.` : ""}{" "}
                Ask {freelancerName} to resend it.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="border-surfaceLight text-xs">
                  <Link href="/">Go to Voucht Homepage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewState === "error" ? (
          <Card className="border-red-500/30 bg-surface shadow-2xl w-full text-center">
            <CardContent className="p-8 sm:p-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-textSecondary max-w-sm mx-auto">
                {errorMessage ?? "We could not load this verification request."}
              </p>
              <Button
                type="button"
                variant="electric"
                className="text-xs font-bold"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : viewState === "confirmed" || viewState === "disputed" ? (
          <Card
            className={`${
              viewState === "confirmed" ? "border-electric/40" : "border-amber-500/40"
            } bg-surface shadow-2xl w-full text-center`}
          >
            <CardContent className="p-8 sm:p-10 space-y-6">
              <div
                className={`w-16 h-16 rounded-full border-2 mx-auto flex items-center justify-center ${
                  viewState === "confirmed"
                    ? "bg-electric/15 border-electric text-electric"
                    : "bg-amber-500/10 border-amber-500 text-amber-400"
                }`}
              >
                {viewState === "confirmed" ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <MessageSquareWarning className="w-9 h-9" />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {viewState === "confirmed"
                    ? alreadyResponded
                      ? "Delivery already confirmed"
                      : "Delivery confirmed"
                    : alreadyResponded
                      ? "Issue already reported"
                      : "Issue reported"}
                </h2>
                <p className="text-sm text-textSecondary mt-2 max-w-md mx-auto">
                  {viewState === "confirmed"
                    ? "Your confirmation has been recorded on this freelancer's delivery ledger."
                    : `Your feedback was recorded. ${freelancerName} has been notified and will follow up directly.`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navyLight border border-surfaceLight text-left text-xs space-y-2">
                <div className="flex justify-between items-center gap-3 text-textSecondary">
                  <span>Status:</span>
                  <span
                    className={`font-bold uppercase font-mono ${
                      viewState === "confirmed" ? "text-electric" : "text-amber-400"
                    }`}
                  >
                    {viewState}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-textSecondary">
                  <span>Project:</span>
                  <span className="text-white font-medium text-right truncate">{projectTitle}</span>
                </div>
                {milestoneTitle ? (
                  <div className="flex justify-between items-center gap-3 text-textSecondary">
                    <span>Milestone:</span>
                    <span className="text-white font-medium text-right truncate">{milestoneTitle}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center gap-3 text-textSecondary">
                  <span>Freelancer:</span>
                  <span className="text-white font-medium">{freelancerName}</span>
                </div>
                <div className="flex justify-between items-center gap-3 text-textSecondary">
                  <span>Client:</span>
                  <span className="text-white font-medium">{request?.clientLabel ?? "Client"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-surfaceLight space-y-3">
                <p className="text-xs text-textSecondary">
                  Want a verifiable delivery record of your own?
                </p>
                <Button asChild variant="electric" className="w-full font-bold h-11 text-xs gap-2">
                  <Link href="/signup">
                    <span>Create a free Voucht profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-textSecondary hover:text-white"
                >
                  <Link href={`/profile/${request?.freelancerUsername ?? ""}`}>
                    <span>View {freelancerName}&apos;s public proof page</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewState === "dispute_form" ? (
          <Card className="border-amber-500/30 bg-surface shadow-2xl w-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <MessageSquareWarning className="w-4 h-4" />
                <span>Report a delivery issue</span>
              </div>
              <CardTitle className="text-xl text-white">
                {milestoneTitle ?? projectTitle}
              </CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                Tell {freelancerName} what is missing or needs revision.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="issue" className="text-xs font-semibold text-slate-200">
                  What is the issue?
                </Label>
                <Textarea
                  id="issue"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Waiting for source files, final deploy URL, or a revision..."
                  className="bg-navyLight border-surfaceLight text-white text-xs focus:border-amber-400"
                />
                <p className="text-[11px] text-textSecondary">
                  Recorded privately and shared with the freelancer — never published on their
                  proof page.
                </p>
              </div>

              {errorMessage ? (
                <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
              ) : null}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewState("form")}
                  className="w-full sm:w-1/2 border-surfaceLight text-xs h-10"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => void sendResponse("dispute")}
                  disabled={submitting}
                  className="w-full sm:w-1/2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10"
                >
                  {submitting ? "Submitting..." : "Send notice to freelancer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-surfaceLight bg-surface shadow-2xl w-full">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2 text-xs text-electric font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Delivery confirmation</span>
              </div>
              <CardTitle className="text-2xl text-white font-black">Confirm delivery</CardTitle>
              <CardDescription className="text-xs text-textSecondary">
                Project: <strong className="text-white">{projectTitle}</strong> &bull; Client:{" "}
                {request?.clientLabel ?? "Client"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-6">
              <div className="p-4 rounded-xl bg-navyLight border border-surfaceLight space-y-3">
                <div className="text-xs text-textSecondary">
                  <span>Milestone:</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {milestoneTitle ?? "Full project delivery"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surfaceLight/60 text-xs text-textSecondary">
                  <div>
                    <span>Freelancer:</span>
                    <div className="text-sm font-bold text-electric mt-0.5">{freelancerName}</div>
                  </div>
                  <div>
                    <span>Due date:</span>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {formatDate(request?.dueDate ?? null)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-2">
                <p className="text-base font-bold text-white">
                  Did {freelancerName} deliver this milestone?
                </p>
                <p className="text-xs text-textSecondary mt-1">
                  Your confirmation adds a verifiable delivery record to their public proof page.
                  Clients are never shown by name, and this link works once.
                </p>
              </div>

              {errorMessage ? (
                <p className="text-xs text-red-400 font-medium text-center">{errorMessage}</p>
              ) : null}

              <div className="space-y-3 pt-1">
                <Button
                  type="button"
                  variant="electric"
                  onClick={() => void sendResponse("confirm")}
                  disabled={submitting}
                  className="w-full text-sm font-black h-12 shadow-lg gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{submitting ? "Recording..." : "Yes, confirm delivery"}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewState("dispute_form")}
                  className="w-full text-xs border-surfaceLight text-textSecondary hover:text-white hover:border-amber-500/40 h-10 gap-2"
                >
                  <MessageSquareWarning className="w-4 h-4" />
                  <span>Not received yet</span>
                </Button>
              </div>

              {typeof request?.wasOnTime === "boolean" ? (
                <p className="text-[11px] text-textSecondary text-center">
                  {request?.wasOnTime
                    ? "This delivery arrived on or before the due date."
                    : "This delivery arrived after the due date."}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="max-w-xl mx-auto w-full py-4 text-center text-xs text-textSecondary border-t border-surfaceLight">
        <p>
          Powered by <strong className="text-white">Voucht</strong> &bull; The verifiable trust
          layer for freelancers
        </p>
      </footer>
    </div>
  );
}
