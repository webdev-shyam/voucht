import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Voucht stores, what a proof page shows publicly, who processes payments and email, and how to ask for your data to be deleted.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE = "29 September 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
      <div className="space-y-3 text-sm sm:text-base leading-relaxed text-[#a0a0b8]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00ff88] mb-3">
          Legal
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#a0a0b8] mb-12">
          Effective {EFFECTIVE}. Voucht is a small product and this policy is
          written to match what the code actually does, not to sound reassuring.
        </p>

        <div className="space-y-12">
          <Section title="What we store">
            <p>
              <span className="text-white font-medium">Your account:</span> your
              email address, display name and the profile fields you fill in
              (username/handle, headline, bio, location, links, avatar).
            </p>
            <p>
              <span className="text-white font-medium">Your work records:</span>{" "}
              project titles and descriptions, milestone titles, deadlines and
              amounts, the client name and client email address you enter for
              each milestone, delivery submissions and the timestamps of each
              client confirmation.
            </p>
            <p>
              <span className="text-white font-medium">Billing:</span> your plan,
              the payment provider, the subscription status and the period end
              date. Card and crypto payment details are handled by the payment
              providers; Voucht does not receive or store card numbers.
            </p>
            <p>
              <span className="text-white font-medium">Proof page visits:</span>{" "}
              when someone opens your public page we record a view with the
              referrer domain. We do not store visitor IP addresses: each visit is
              matched to a one-way hash of the IP plus that day, so we can count
              roughly one view per person per day and nothing more.
            </p>
          </Section>

          <Section title="What a public proof page shows">
            <p>
              Public pages are built from database views that expose a fixed
              column list: your name, handle, headline, bio, location, website and
              LinkedIn links, your calculated Trust Score, your tier, project and
              milestone titles, delivery dates, whether each delivery was on time,
              when a client confirmed it, and a masked client label such as
              &ldquo;S***a J.&rdquo;.
            </p>
            <p>
              Public pages never show client email addresses, verification tokens,
              contract text, amounts, credentials or anything you did not type as
              a project or milestone title. Client emails exist so the
              confirmation link can reach the right inbox.
            </p>
          </Section>

          <Section title="Verification links">
            <p>
              When you ask for a delivery to be verified we create a random,
              unguessable token and email a link containing it to the client email
              address you provided. The link opens without a Voucht account, shows
              only that one delivery (project title, milestone title, deadline,
              your name), and stops working as soon as the client confirms it,
              disputes it, or the link expires. A disputed delivery is never
              counted in the Trust Score.
            </p>
          </Section>

          <Section title="Who else processes data">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white font-medium">Supabase</span> hosts the
                Postgres database and authentication.
              </li>
              <li>
                <span className="text-white font-medium">Vercel</span> hosts and
                serves the application.
              </li>
              <li>
                <span className="text-white font-medium">Resend</span> sends
                verification, reminder and billing emails.
              </li>
              <li>
                <span className="text-white font-medium">CREEM</span> is the
                merchant of record for card subscriptions and{" "}
                <span className="text-white font-medium">NOWPayments</span> for
                crypto subscriptions. They process payment data and their own
                privacy policies apply to that processing.
              </li>
              <li>
                <span className="text-white font-medium">Google Gemini</span>
                {""} is called only when you press &ldquo;generate contract
                draft&rdquo;, using the project and milestone details of that
                draft as the prompt.
              </li>
            </ul>
            <p>
              We do not run advertising trackers or sell or rent personal data.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Voucht sets first-party session cookies used by Supabase Auth to keep
              you signed in. There are no advertising or cross-site tracking
              cookies. Your browser&rsquo;s sessionStorage also remembers that it
              already counted one view of a proof page, so refreshing the page does
              not double count it.
            </p>
          </Section>

          <Section title="How long we keep it, and deleting your data">
            <p>
              Work records stay as long as your account exists, because the Trust
              Score is calculated from them. Deleting a project removes its
              milestones, deliveries and the client emails attached to them, and
              the score recalculates.
            </p>
            <p>
              There is no self-service delete button in the product yet. Email{" "}
              <a
                href="mailto:hello@voucht.tech?subject=Data%20deletion%20request"
                className="text-[#00ff88] underline underline-offset-4"
              >
                hello@voucht.tech
              </a>{" "}
              from the address on the account and we will remove a project, a
              client record, or the whole account including its auth user, then
              confirm to you. We also honour requests to see or correct what we
              hold.
            </p>
          </Section>

          <Section title="Security">
            <p>
              Every table enforcing row-level security means an account can only
              read and write its own rows; server code that needs broader access
              uses separate service-role credentials that never reach the browser.
              Traffic is encrypted in transit and the database is encrypted at
              rest by the provider. No system is perfectly secure, so keep your
              password and your verification links private.
            </p>
          </Section>

          <Section title="Children and regions">
            <p>
              Voucht is a work-reputation tool for adults and is not directed at
              children under 16. Data is stored on the provider&rsquo;s
              infrastructure; depending on your plan the region may change, so
              treat the addresses above as the place to ask where your rows live
              today.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If this policy changes materially we will update the effective date
              on this page and, where we have a working email channel, tell
              account holders.
            </p>
          </Section>

          <p className="text-sm text-[#a0a0b8] pt-4 border-t border-white/10">
            Questions: <a href="mailto:hello@voucht.tech" className="text-[#00ff88] underline underline-offset-4">hello@voucht.tech</a>. See also the{" "}
            <Link href="/terms" className="text-[#00ff88] underline underline-offset-4">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
