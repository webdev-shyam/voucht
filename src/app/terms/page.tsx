import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The rules for using Voucht: what the Trust Score means, plan limits, billing through our payment providers, and what the AI contract drafts are and are not.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE = "29 September 2026";

// Before launch, replace with your registered entity and governing law once you
// have them. Publishing a jurisdiction that does not exist is worse than saying
// nothing here.
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00ff88] mb-3">
          Legal
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-[#a0a0b8] mb-12">
          Effective {EFFECTIVE}. By creating an account or using voucht.tech you
          agree to these terms.
        </p>

        <div className="space-y-12">
          <Section title="The service">
            <p>
              Voucht lets you record freelance projects and milestones, send a
              client a link to confirm a delivery, publish a proof page of the
              confirmed work, and display a Trust Score calculated from those
              records. We work to keep it available but this is an early product:
              features, limits and prices can change, and a feature may be
              temporarily unavailable.
            </p>
          </Section>

          <Section title="Your account">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You must be old enough to contract where you live, and you are
                responsible for activity on your account.
              </li>
              <li>
                Keep your password safe. A signed-in session can change your
                records.
              </li>
              <li>
                One account per person or business. Do not create accounts to
                multiply your own record of confirmed work.
              </li>
            </ul>
          </Section>

          <Section title="What you may record">
            <p>
              Record real engagements you actually worked on. Only send a
              verification request to a client contact address you are using for
              that engagement, and never submit a confirmation yourself: the
              score is only meaningful while the confirmation comes from the
              client&rsquo;s own inbox.
            </p>
            <p>
              Anything in a project title, milestone title or description can end
              up on a public page. Do not put confidential client information,
              trade secrets, personal data about people who did not agree to it, or
              unlawful content into a record you intend to publish.
            </p>
            <p>
              Prohibited: abusing the service for illegal activity, infringing
              other people&rsquo;s rights, attempting to break access controls or
              row-level security, automated scraping of other users&rsquo; proof
              pages, and interfering with the service for others.
            </p>
          </Section>

          <Section title="The Trust Score">
            <p>
              The score is an arithmetic summary of the records in your account:
              completed projects, on-time client-confirmed deliveries, cancelled
              projects and volume, weighted 40 / 25 / 20 / 15. It is calculated by
              the database and cannot be written by an account holder, by a paid
              plan, or by a URL parameter.
            </p>
            <p>
              It is an indicator, not a guarantee. It does not warrant the quality
              of your work, the outcome of an engagement, or that a client will pay
              you. A quiet client who never opens a confirmation link keeps that
              delivery out of your score, and an account with no confirmed delivery
              shows &ldquo;No verified work history yet&rdquo; rather than a
              number.
            </p>
          </Section>

          <Section title="AI contract drafts">
            <p>
              On paid plans you can generate a draft agreement from your project
              and milestone details. These drafts are a starting point. They are
              not legal advice, they are not reviewed by a lawyer, and we make no
              promise that any draft is enforceable, complete or suitable for your
              jurisdiction. Edit them, and take anything important to a qualified
              professional. Pressing generate sends that draft&rsquo;s details to
              our AI provider.
            </p>
          </Section>

          <Section title="Plans, payment and cancellation">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Free keeps 1 active project. Pro and Elite are billed per month in
                30-day periods at the price shown on the pricing page at checkout.
              </li>
              <li>
                Card subscriptions are billed by CREEM acting as merchant of
                record; crypto subscriptions are processed by NOWPayments. Their
                terms and privacy policies apply to the payment itself.
              </li>
              <li>
                A crypto payment buys a 30-day pass that does not renew by itself;
                access ends at the period end and your account returns to Free.
              </li>
              <li>
                Cancelling a card subscription stops the next renewal and happens
                with the payment provider; your plan stays active until the period
                you already paid for ends.
              </li>
              <li>
                Refunds are handled case by case; send a request to{" "}
                <a
                  href="mailto:hello@voucht.tech?subject=Refund%20request"
                  className="text-[#00ff88] underline underline-offset-4"
                >
                  hello@voucht.tech
                </a>{" "}
                and we will tell you honestly what is possible. There is no
                automatic money-back promise.
              </li>
              <li>
                If your subscription lapses or is cancelled, your projects,
                confirmed deliveries and score remain in your account. If a paid
                feature is unavailable, that does not change your plan status
                silently; the dashboard shows what your account can do.
              </li>
            </ul>
          </Section>

          <Section title="Your content and licence">
            <p>
              You keep ownership of the text and files you upload. You grant Voucht
              the licence it needs to host, display and share them &mdash;
              including rendering your public proof page and badge &mdash; and to
              send the related emails. That licence ends when the content is
              deleted.
            </p>
            <p>
              Do not present the badge or score as an endorsement issued by
              Voucht. It reports your records; it is not a certification of
              competence by us or by any third party.
            </p>
          </Section>

          <Section title="Suspension and termination">
            <p>
              You can ask us to delete your account at any time by emailing{" "}
              <a href="mailto:hello@voucht.tech" className="text-[#00ff88] underline underline-offset-4">
                hello@voucht.tech
              </a>{" "}
              from the address on the account. We may suspend or stop providing the
              service where we reasonably believe these terms are being broken,
              where required by law, or to protect the service or other users.
            </p>
          </Section>

          <Section title="Disclaimers">
            <p>
              The service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo;. Apart from what consumer law gives you and cannot
              be taken away, we do not warrant that the service is uninterrupted,
              error-free, or that the score or any confirmation will lead to work,
              payment or any result.
            </p>
          </Section>

          <Section title="Liability">
            <p>
              To the extent the law allows, we are not liable for indirect or
              consequential losses, including lost income or lost business
              opportunities arising from use of the service. Our liability for
              other claims is limited to the fees you paid us in the 12 months
              before the claim.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              If we change these terms in a way that matters, we update the
              effective date below and, where we can, tell account holders by
              email. Continuing to use the service afterwards means the new terms
              apply.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions, abuse reports and deletion requests:{" "}
              <a href="mailto:hello@voucht.tech" className="text-[#00ff88] underline underline-offset-4">
                hello@voucht.tech
              </a>
              . See also the{" "}
              <Link href="/privacy" className="text-[#00ff88] underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <p className="text-xs text-[#a0a0b8]/70 pt-6 border-t border-white/10">
            These terms describe how Voucht currently operates. They are a product
            document, not legal advice, and you should have your own lawyer review
            them for your jurisdiction and business entity.
          </p>
        </div>
      </div>
    </main>
  );
}
