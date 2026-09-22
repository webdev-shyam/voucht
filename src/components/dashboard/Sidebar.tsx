"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard (overview)", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/contracts", label: "Contracts", icon: FileCheck2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);

  // Derive plan badge text (FREE / PRO / ELITE)
  const planBadge =
    user.tier === "free"
      ? "FREE"
      : user.tier === "elite"
      ? "ELITE"
      : "PRO";

  // Calculate circular mini score stroke
  const miniSize = 44;
  const strokeWidth = 4;
  const radius = (miniSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(100, Math.max(0, user.trustScore || 78));
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  const ringColor =
    scorePercent >= 80 ? "#00ff88" : scorePercent >= 60 ? "#fbbf24" : "#f87171";

  return (
    <aside className="w-[280px] border-r border-surfaceLight bg-surface flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Top: ✓ voucht logo */}
        <div className="p-5 border-b border-surfaceLight flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-electric/15 border border-electric/30 flex items-center justify-center font-bold text-electric text-lg group-hover:scale-105 transition-transform">
              ✓
            </div>
            <span className="text-xl font-black tracking-tight text-white font-mono">
              voucht
            </span>
          </Link>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textSecondary bg-navyLight px-2 py-0.5 rounded border border-surfaceLight">
            v2.0
          </span>
        </div>

        {/* User Card: Avatar + Name + Plan Badge + Trust Score mini circular display */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-navyLight/80 border border-surfaceLight">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-surfaceLight shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-navyMid flex items-center justify-center font-bold text-white text-sm border border-surfaceLight shrink-0">
                  {user.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white truncate block">
                    {user.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant={
                      planBadge === "ELITE"
                        ? "default"
                        : planBadge === "PRO"
                        ? "electric"
                        : "secondary"
                    }
                    className="text-[10px] py-0 px-1.5 font-mono font-bold uppercase tracking-wide h-4"
                  >
                    {planBadge}
                  </Badge>
                  <span className="text-[11px] text-textSecondary truncate">
                    @{user.username}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Score mini circular display */}
            <div
              className="relative flex items-center justify-center shrink-0"
              title={`Trust Score: ${scorePercent}/100`}
            >
              <svg width={miniSize} height={miniSize} className="rotate-[-90deg]">
                <circle
                  cx={miniSize / 2}
                  cy={miniSize / 2}
                  r={radius}
                  stroke="#16213e"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx={miniSize / 2}
                  cy={miniSize / 2}
                  r={radius}
                  stroke={ringColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold font-mono text-white leading-none">
                  {scorePercent}
                </span>
                <span className="text-[7px] uppercase font-bold text-textSecondary leading-none scale-90">
                  pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items with icons */}
        <nav className="px-2 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm transition-colors ${
                  isActive
                    ? "border-l-2 border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10 font-semibold"
                    : "text-textSecondary hover:text-white hover:bg-surfaceLight/50 border-l-2 border-transparent font-medium"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#00ff88]" : "text-textSecondary"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-surfaceLight space-y-2">
        {/* Upgrade to Pro ✨ button (only show on free plan) */}
        {user.tier === "free" && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-electric/15 to-emerald-500/10 border border-electric/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-electric mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlimited Access</span>
            </div>
            <p className="text-[11px] text-textSecondary mb-2.5 leading-snug">
              Unlock unlimited projects, dynamic badges, and Gemini smart contracts.
            </p>
            <Button
              asChild
              size="sm"
              variant="electric"
              className="w-full text-xs font-bold h-8 shadow-sm"
              onClick={onClose}
            >
              <Link href="/dashboard/billing">Upgrade to Pro ✨</Link>
            </Button>
          </div>
        )}

        <Link
          href={`/profile/${user.username}`}
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-electric bg-electric/5 border border-electric/20 hover:bg-electric/15 transition-colors"
        >
          <span className="truncate">Public Proof: voucht.tech/{user.username}</span>
          <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-textSecondary hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit to Main Site</span>
        </Link>
      </div>
    </aside>
  );
}
