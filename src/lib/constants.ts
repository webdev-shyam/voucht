export const APP_NAME = "Voucht";
export const APP_TAGLINE = "Verifiable Trust Engine for Freelancers & Agencies";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://voucht.tech";

export const TRUST_TIERS = {
  ELITE: { min: 90, label: "Elite Verified", color: "#00ff88" },
  PROVEN: { min: 75, label: "Proven Performer", color: "#38bdf8" },
  ESTABLISHED: { min: 50, label: "Established", color: "#fbbf24" },
  NEW: { min: 0, label: "Emerging Talent", color: "#a0a0b8" },
};

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Start building your initial verifiable proof record.",
    features: [
      "1 Active Project",
      "Public Proof Page (voucht.tech/username)",
      "Standard Trust Score Calculation",
      "Client Email Confirmations",
      "Basic Milestone Ledger",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    interval: "month",
    description: "For independent freelancers who win high-ticket clients with proof.",
    features: [
      "Unlimited Active Projects & Milestones",
      "Embeddable Trust Badge (SVG/HTML/React)",
      "AI Smart Contract Generator (Gemini)",
      "Priority Client Email Notifications",
      "Automated Milestone Reminders",
      "Full Activity Log & Audit Trail",
    ],
    cta: "Upgrade to Pro — $10/mo",
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: 29,
    interval: "month",
    description: "Top 1% freelancers & agencies needing full analytics and guarantees.",
    features: [
      "Everything in Pro",
      "Profile Views & Audience Analytics",
      "Zero-Dispute Shield Guarantee Badge",
      "Custom Domain Support",
      "NOWPayments Crypto & CREEM Gateways",
      "Priority 24/7 Concierge Support",
    ],
    cta: "Upgrade to Elite — $29/mo",
    popular: false,
  },
];
