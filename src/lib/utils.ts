import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
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

export function maskClientName(name?: string): string {
  if (!name) return "S***a J.";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const w = parts[0];
    if (w.length <= 2) return `${w[0]}*`;
    return `${w[0]}***${w[w.length - 1]}`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  const firstMasked =
    first.length > 2
      ? `${first[0]}***${first[first.length - 1]}`
      : `${first[0]}*`;
  return `${firstMasked} ${last[0].toUpperCase()}.`;
}

export type FeatureKey =
  | "unlimited_projects"
  | "trust_badge"
  | "smart_contracts"
  | "milestone_reminders"
  | "profile_analytics"
  | "directory_listing"
  | "custom_url";

export function canAccess(userPlan: Plan | string | undefined, feature: FeatureKey | string): boolean {
  const plan = (userPlan || "free").toLowerCase();

  switch (feature) {
    case "unlimited_projects":
    case "trust_badge":
    case "milestone_reminders":
      return plan === "pro" || plan === "elite" || plan === "agency";

    case "smart_contracts":
      // Pro gets 5/mo, Elite gets unlimited. Free cannot access.
      return plan === "pro" || plan === "elite" || plan === "agency";

    case "profile_analytics":
    case "directory_listing":
    case "custom_url":
      return plan === "elite" || plan === "agency";

    default:
      return true;
  }
}

