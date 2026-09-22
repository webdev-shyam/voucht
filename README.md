# Voucht — The Trust Layer for Freelancers

> **Build a verified Trust Score that proves your reliability. Get vouched. Get hired.**

Clients don't hire the best freelancer — they hire the one they **TRUST** most. Voucht gives freelancers a verified, cryptographic Trust Score (0–100) based on actual project delivery milestones confirmed by authorized clients.

---

## 🌟 Key Features

1. **🏆 Verified Trust Score (0–100)**
   - Algorithmic evaluation based on on-time delivery rate (40%), milestone completion (30%), response latency (15%), and dispute/ghost penalties (15%).
   - Automatic tier assignment: *Exceptional* (80+), *Reliable* (60–79), and *Building* (<60).

2. **🌐 Public Proof Page (`/profile/[username]`)**
   - Clean, shareable public ledger displaying verified deliveries with masked client privacy (`S***a J.`), milestone timestamps, and live reputation gauge.
   - ISR-cached (`revalidate: 3600`) for high-speed edge delivery.

3. **📄 AI Smart Contracts**
   - Generate enforceable freelance contracts with milestone breakdowns, SLAs, and payment terms in under 60 seconds using Gemini AI.

4. **✅ Client Verification Workflow**
   - Seamless one-click verification tokens sent to client emails via Resend.
   - Clients confirm or dispute deliveries directly through secure token links (`/verify?token=...`).

5. **🏅 Embeddable Trust Badge (`/badge/[username]`)**
   - Live, dynamic 250×50 SVG badge displaying live Trust Score and completed project counts.
   - Embeddable via `<img>` or `<iframe>` anywhere (GitHub, personal portfolio, email signatures).

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

# AI & Email
GEMINI_API_KEY=your-gemini-key
RESEND_API_KEY=re_your_resend_api_key

# Payment Webhooks & Secrets
CREEM_API_KEY=your_creem_api_key
CREEM_WEBHOOK_SECRET=your_creem_webhook_secret
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret

# Cron Security
CRON_SECRET=your_secret_cron_token
```

### 3. Database Setup

Execute the SQL migration schema in `supabase/schema.sql` within your Supabase SQL Editor:
- Creates `profiles`, `projects`, `milestones`, `deliveries`, `subscriptions`, and `activity_log` tables.
- Enables Row Level Security (RLS) policies.
- Registers the `recalculate_trust_score(p_freelancer_id)` stored procedure.

### 4. Run Development Server

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
