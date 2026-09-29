import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_URL } from "./constants";
import { Plan } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function truncateString(str: string, length: number = 20): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

// Mirrors public.mask_client_name() in supabase/migrations, which is what the
// public proof views return. Keep the two in step: the database is authoritative
// for anything a visitor sees.
export function maskClientName(name?: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "Client";

  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  let masked = first.slice(0, 1) + "***";
  if (first.length > 2) masked += first.slice(-1).toLowerCase();

  const last = parts[1];
  if (last) masked += ` ${last.slice(0, 1).toUpperCase()}.`;

  return masked;
}

// Canonical share targets for a public proof page and its embeddable badge.
export function proofPageUrl(username: string): string {
  return `${APP_URL}/profile/${username}`;
}

export function badgeImageUrl(username: string): string {
  return `${APP_URL}/api/badge/${username}`;
}

// Formats a stored timestamp; it does not invent one.
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Only features the product actually gates are listed. The proof page and the
// badge are free on every plan; /api/badge has no plan check to gate them with.
export type FeatureKey =
  | "unlimited_projects"
  | "smart_contracts"
  | "milestone_reminders"
  | "profile_analytics";

export function canAccess(userPlan: Plan | string | undefined, feature: FeatureKey | string): boolean {
  const plan = (userPlan || "free").toLowerCase();
  const paid = plan === "pro" || plan === "elite";

  switch (feature) {
    case "unlimited_projects":
    case "smart_contracts":
    case "milestone_reminders":
      return paid;

    case "profile_analytics":
      return plan === "elite";

    default:
      return true;
  }
}

