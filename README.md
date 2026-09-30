# Voucht — The Trust Layer for Freelancers

> **Build a verified Trust Score that proves your reliability. Get vouched. Get hired.**

Clients don't hire the best freelancer — they hire the one they **TRUST** most. Voucht gives freelancers a Trust Score (0–100) calculated by the database from milestones the client confirmed themselves.

---

## 🌟 Key Features

1. **🏆 Trust Score (0–100)**
   - One implementation: `recalculate_trust_score()` in `supabase/migrations/0001_harden_rls_and_trust_score.sql`. The app reads the stored number and never computes one.
   - Weights: completed projects (40%), on-time client-confirmed deliveries (25%), no cancelled work (20%), track record volume (15%).
   - Tiers: *Not yet verified* (no confirmed delivery), *Building* (1+ confirmed delivery), *Reliable* (60+ with 2 completed), *Highly reliable* (80+ with 3 completed).
   - A brand-new account has no score at all — it is shown as "No verified work history yet.", never as a made-up number.

2. **🌐 Public Proof Page (`/profile/[username]`)**
   - Clean, shareable public ledger displaying verified deliveries with masked client privacy (`S***a J.`), milestone timestamps, and live reputation gauge.
   - ISR-cached (`revalidate: 3600`) for high-speed edge delivery.

3. **📄 AI contract drafts**
   - Generate a first-draft freelance agreement with milestone breakdown, delivery terms and payment terms using Gemini. Output is a starting point for review, not legal advice and not a self-enforcing document.

4. **✅ Client verification workflow**
   - The freelancer sends a verification request from a delivery; the client gets a single-use link (`/verify/[token]`) by email.
   - `record_verification()` runs as `SECURITY DEFINER`: it locks the delivery, writes the milestone and project state, recalculates the Trust Score and appends the activity log in one transaction.

5. **🏅 Embeddable Trust Badge (`/api/badge/[username]`)**
   - Dynamic SVG showing the stored Trust Score, or an "awaiting first verification" state for accounts with no history.
   - Embeddable with `<img>` anywhere (GitHub, portfolio, email signature). `<iframe>` works too; the badge route sets `frame-ancestors *`.

6. **💳 Multi-Rail Subscriptions**
   - **CREEM**: Merchant of Record for global credit & debit card recurring billing.
   - **NOWPayments**: Direct cryptocurrency payments (BTC, ETH, USDT, SOL) with automated 30-day lifecycle management.
   - Tiered plans: Free, Pro ($10/mo), and Elite ($29/mo).

7. **⏰ Consolidated Cron Engine (`/api/cron/check-milestones`)**
   - Single daily cron scheduled for 8:00 AM UTC (`0 8 * * *`) via `vercel.json` (Hobby plan compliant).
   - Automatically handles 48-hour milestone due reminders, overdue milestone transitions, and crypto subscription renewal notices.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Animation**: [Motion / Framer Motion](https://motion.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS, pg_cron, auth sessions)
- **AI Intelligence**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Gemini models)
- **Transactional Email**: [Resend](https://resend.com/)
- **Payments**: [CREEM](https://creem.io/) (Cards) & [NOWPayments](https://nowpayments.io/) (Crypto)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- Supabase project (or run in simulated local mode)

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App & Domain
NEXT_PUBLIC_APP_URL=https://voucht.tech

# AI & Email — both optional; the features report themselves unavailable
# rather than inventing output when the key is missing.
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=
RESEND_API_KEY=re_your_resend_api_key

# Payment providers
# Card checkout is per plan: CREEM_PRODUCT_ID_PRO enables Pro only, and Elite
# needs its own id. A missing id shows "Card checkout unavailable" in the UI
# instead of a checkout that cannot be paid.
CREEM_API_KEY=your_creem_api_key
CREEM_PRODUCT_ID_PRO=prod_...
CREEM_PRODUCT_ID_ELITE=prod_...
CREEM_WEBHOOK_SECRET=your_creem_webhook_secret
CREEM_TEST_MODE=false
CREEM_API_BASE=
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret
NOWPAYMENTS_SANDBOX=true

# Cron Security
CRON_SECRET=your_secret_cron_token

# Proof page visit analytics (rotates the daily viewer hash)
PROFILE_VIEW_HASH_SECRET=generate_a_random_string
```

### 3. Database setup

Apply in order in the Supabase SQL editor (or `supabase db push`):

1. `supabase/schema.sql` — base tables, indexes, first-pass RLS policies and the
   `handle_new_user()` trigger.
2. `supabase/migrations/0001_harden_rls_and_trust_score.sql` — idempotent
   hardening pass: column renames, owner-only RLS on the private tables, the
   `public_profiles` / `public_deliveries` projections used by public pages,
   `mask_client_name()`, `recalculate_trust_score()` and its triggers, and the
   `get_verification_request()` / `record_verification()` RPCs.

Both files are safe to re-run. Then run `supabase/verify.sql` as a third,
read-only query: it lists the tables, views, policies, functions, triggers and
grants that must exist, each with its expected result, so a silently rolled-back
batch is visible instead of surfacing later as a broken dashboard.

Regenerate `src/lib/types.ts` afterwards:

```bash
npx supabase gen types typescript --linked > src/lib/types.gen.ts
```

The hand-maintained `src/lib/types.ts` mirrors the schema; keep the two in step
when a migration adds a column.

### 4. Supabase Auth configuration

Everything here is dashboard state, not code — the app cannot supply it.

**Redirect allowlist** — Authentication → URL Configuration → Redirect URLs:

```
http://localhost:3000/callback
https://voucht.tech/callback
```

`/callback` is the only route that exchanges an OAuth or email-confirmation
code for a session, so a missing entry makes Google sign-in bounce back without
a visible error. Site URL must be `https://voucht.tech` in production, otherwise
confirmation links open the wrong host.

**Google** — Authentication → Sign In / Providers → Google: enabled, with the
OAuth client's redirect URI set to
`https://<project-ref>.supabase.co/auth/v1/callback`. The client secret lives in
Supabase only; it is never an environment variable of this app.

**Emails from your own domain** — Authentication → SMTP Settings: enable it and
point it at your transactional provider (Resend: host `smtp.resend.com`, port
`465`, user `resend`, password = the Resend API key). Set Sender email to an
address on a domain you have DNS-verified there, e.g.
`Voucht <hello@voucht.tech>`. Until SMTP is enabled, Supabase sends through its
own `noreply@mail.app.supabase.io`, which is why confirmations do not look like
they came from Voucht.

**Require confirmation** — Authentication → Providers → Email: "Confirm email"
ON. `signUp` then returns no session and the signup screen shows the
check-your-inbox step; password sign-in stays blocked with "Email not confirmed"
until the link is opened, and the login screen offers a resend.

### 5. Run Development Server

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security & Privacy

- **API Route Protection**: In-memory rate limiting (max 5 requests/min/IP) on verification routes.
- **Webhook Integrity**: Cryptographic HMAC-SHA256 signature verification for CREEM and HMAC-SHA512 for NOWPayments IPN.
- **Client Identity Masking**: Automatically shields client personal details on public proof pages.
- **Security Headers**: Explicit Content Security Policy with `frame-ancestors *` reserved exclusively for public badges.
