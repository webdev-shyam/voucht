import Link from "next/link";
import { ArrowLeft, FileQuestion, Home, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center p-4 selection:bg-electric selection:text-navy">
      <div className="max-w-md w-full text-center space-y-6 bg-surface border border-surfaceLight rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-electric/10 border border-electric/30 flex items-center justify-center text-electric mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-electric uppercase tracking-widest">
            404 &bull; Page Not Found
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Record or Profile Not Found
          </h1>
          <p className="text-sm text-textSecondary leading-relaxed">
            The page, verified profile, or milestone contract you are looking for does not exist, has been archived, or the URL was typed incorrectly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            asChild
            variant="outline"
            className="flex-1 gap-2 border-surfaceLight hover:bg-surfaceLight/50 text-white"
          >
            <Link href="/">
              <Home className="w-4 h-4 text-electric" />
              <span>Back to Home</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="electric"
            className="flex-1 gap-2 font-bold"
          >
            <Link href="/dashboard">
              <ShieldCheck className="w-4 h-4 text-navy" />
              <span>Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
