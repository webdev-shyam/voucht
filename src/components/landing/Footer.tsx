import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { SUPPORT_EMAIL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1a1a2e] pt-16 pb-12 text-[#a0a0b8] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col items-start gap-4">
            <Logo size="md" />
            <p className="text-sm text-[#a0a0b8] max-w-sm leading-relaxed">
              Publish the work your clients already confirmed. Voucht turns
              delivered milestones into a proof page and a score that the API
              cannot write.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#00ff88]">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span>Score recalculated on every client confirmation</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#example-proof" className="hover:text-[#00ff88] transition-colors">
                  Example proof page
                </a>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Create free account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm mb-8">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Built with
            </h4>
            <p className="text-xs leading-relaxed text-[#a0a0b8]">
              Next.js on Vercel, Postgres with row-level security on Supabase,
              Resend for email, CREEM and NOWPayments for billing.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a0a0b8]">
          <p>&copy; 2026 Voucht. Built for freelancers who deliver.</p>
          <p className="text-[#a0a0b8]/60">
            Client-confirmed deliveries &middot; editable AI contract drafts
          </p>
        </div>
      </div>
    </footer>
  );
}
