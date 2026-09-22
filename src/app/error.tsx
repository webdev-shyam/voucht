"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console / error monitoring
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-surface border border-surfaceLight rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-textSecondary leading-relaxed">
            An unexpected error occurred while processing your request. Don&apos;t worry, your verified trust data is safely preserved.
          </p>
        </div>

        {error.digest && (
          <div className="p-3 rounded-lg bg-navyLight border border-surfaceLight text-[11px] font-mono text-textSecondary select-all">
            Error Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="flex-1 gap-2 border-surfaceLight hover:bg-surfaceLight/50 text-white"
          >
            <RefreshCw className="w-4 h-4 text-electric" />
            <span>Try Again</span>
          </Button>
          <Button
            asChild
            variant="electric"
            className="flex-1 gap-2 font-bold"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4 text-navy" />
              <span>Go to Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
