"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

interface TopNavProps {
  onOpenMobileSidebar?: () => void;
}

export function TopNav({ onOpenMobileSidebar }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const activities = useAppStore((state) => state.activities);
  const [unreadCount, setUnreadCount] = useState(2);

  // Compute page title dynamically from route
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/dashboard/projects/new")) return "New Project";
    if (pathname.startsWith("/dashboard/projects/")) return "Project Overview";
    if (pathname.startsWith("/dashboard/projects")) return "My Projects";
    if (pathname.startsWith("/dashboard/contracts/new")) return "Generate Smart Contract";
    if (pathname.startsWith("/dashboard/contracts")) return "AI Contracts";
    if (pathname.startsWith("/dashboard/settings")) return "Settings";
    if (pathname.startsWith("/dashboard/billing")) return "Billing & Plans";
    return "Dashboard";
  };

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been safely signed out of your session.",
    });
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-surfaceLight bg-surface/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile menu button + Page title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 min-h-[44px] min-w-[44px] text-textSecondary hover:text-white"
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Notification bell icon + User avatar dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full text-textSecondary hover:text-white hover:bg-surfaceLight"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-electric ring-2 ring-surface animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 border-surfaceLight bg-surface text-white p-0 shadow-xl"
          >
            <div className="p-3 border-b border-surfaceLight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="electric" className="text-[10px] py-0 px-1.5 h-4">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-[11px] text-electric hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-surfaceLight/50">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="p-3 hover:bg-surfaceLight/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-200 leading-snug">
                      {act.title}
                    </p>
                    <span className="text-[10px] text-textSecondary shrink-0">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary mt-0.5 line-clamp-1">
                    {act.description}
                  </p>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Dropdown (Settings, Billing, Log Out) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-1 rounded-full hover:bg-surfaceLight transition-colors focus:outline-none focus:ring-2 focus:ring-electric"
              aria-label="User menu"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-surfaceLight"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-navyMid border border-surfaceLight flex items-center justify-center text-xs font-bold text-white">
                  {user.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-surfaceLight bg-surface text-white shadow-xl"
          >
            <DropdownMenuLabel className="font-normal p-3 pb-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-white">
                  {user.fullName}
                </p>
                <p className="text-xs leading-none text-textSecondary">
                  {user.email}
                </p>
                <div className="pt-1">
                  <Badge variant="electric" className="text-[10px] py-0 px-1.5 uppercase font-mono">
                    {user.tier} Plan
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-surfaceLight" />
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-surfaceLight">
              <Link href="/dashboard/settings" className="flex items-center gap-2 text-xs">
                <Settings className="w-3.5 h-3.5 text-textSecondary" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-surfaceLight">
              <Link href="/dashboard/billing" className="flex items-center gap-2 text-xs">
                <CreditCard className="w-3.5 h-3.5 text-textSecondary" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-surfaceLight">
              <Link href={`/profile/${user.username}`} target="_blank" className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-electric" />
                <span>Public Proof Page</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surfaceLight" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 text-xs flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
