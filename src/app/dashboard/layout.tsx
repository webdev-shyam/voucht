"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const user = useAppStore((state) => state.user);
  const load = useAppStore((state) => state.load);

  // One fetch for the whole dashboard area; the store keeps the rows so every
  // page under /dashboard renders from the same session-scoped data.
  useEffect(() => {
    void load();
  }, [load]);

  if (status === "signed-out") {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-xl font-bold text-white">You are signed out</h1>
        <p className="text-sm text-textSecondary max-w-md">
          Your session ended, so we can&rsquo;t show your projects. Sign in again
          to load them.
        </p>
        <Button asChild variant="electric" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  // The sidebar, the top nav and every page under /dashboard read `user.tier`
  // for plan gating, so nothing mounts until the session data exists. While a
  // cold load is in flight (and during the static build) `user` is still null.
  if (!user) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4 text-center px-6">
        {status === "error" ? (
          <>
            <p className="text-sm text-red-300 max-w-md">
              {error ?? "Something went wrong while loading your data."}
            </p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          </>
        ) : (
          <p className="text-sm text-textSecondary">Loading your dashboard…</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex text-slate-100">
      {/* Desktop Fixed Sidebar 280px */}
      <div className="hidden md:block w-[280px] shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile Slide-in Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[280px] border-r border-surfaceLight bg-surface text-white sm:max-w-[280px]"
        >
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {status === "error" ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 mb-6">
              <p className="text-sm text-red-300">
                {error ?? "Something went wrong while loading your data."}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-xs"
                onClick={() => void load()}
              >
                Try again
              </Button>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
