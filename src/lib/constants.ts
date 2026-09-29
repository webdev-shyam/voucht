export const APP_NAME = "Voucht";
export const APP_TAGLINE = "Verifiable Trust Engine for Freelancers & Agencies";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://voucht.tech";

// Badge tiers and their thresholds live in src/lib/trust-score.ts (BADGE_TIERS),
// which mirrors the single database implementation of the score.

// Keep this list aligned with canAccess() in src/lib/utils.ts: a line here is
// only allowed if the code actually gates that feature (or gives it to everyone).
export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Everything you need to publish your first verified delivery.",
    features: [
      "1 active project",
      "Public proof page (voucht.tech/username)",
      "Client confirmation links by email",
      "Trust Score calculated from confirmed deliveries",
      "Embeddable trust badge (live SVG)",
      "Masked client names on every public surface",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    interval: "month",
    description: "For freelancers running several clients at once.",
    features: [
      "Everything in Free",
      "Unlimited projects and milestones",
      "AI contract drafts you can edit and review",
      "Automated milestone deadline reminders",
      "Full activity log of every recorded change",
    ],
    cta: "Upgrade to Pro — $10/mo",
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: 29,
    interval: "month",
    description: "Pro plus analytics for your proof page.",
    features: [
      "Everything in Pro",
      "Proof page view counts",
      "Referrer domains and traffic sources",
    ],
    cta: "Upgrade to Elite — $29/mo",
    popular: false,
  },
];
