export const APP_NAME = "Voucht";
export const APP_TAGLINE = "Verifiable Trust Engine for Freelancers & Agencies";

// `voucht.tech` answers with a 308 to `www.voucht.tech`, so www is the origin the
// app is actually served from. Third-party callbacks must name it: a webhook or
// IPN posted to the apex gets redirected, providers do not follow a redirect on
// a POST, and the payment then looks like it vanished. Override with
// NEXT_PUBLIC_APP_URL per deployment; keep it equal to the Supabase Site URL.
export const SITE_ORIGIN = "https://www.voucht.tech";

// An origin configured without a scheme — `voucht.tech`, which is how deployment
// URLs are usually copied — yields callback URLs that payment providers reject
// with an opaque 400 and makes `new URL()` throw. Normalising here means a
// mistyped variable cannot silently take checkout down.
export function originFromEnv(value: string | undefined): string {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return SITE_ORIGIN;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const APP_URL = originFromEnv(process.env.NEXT_PUBLIC_APP_URL);

// The mailbox customers see on the site (terms, privacy, footer, FAQ, cancel
// link) and that transactional mail is sent from. Public because it is rendered
// into `mailto:` links in client components. It must be on a domain verified
// with the email provider, or the mail will not be sent at all; replies to it
// land in the Titan mailbox for the same address.
export const SUPPORT_EMAIL =
  (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "").trim() || "support@voucht.tech";

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
