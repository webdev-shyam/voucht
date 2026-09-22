import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1a1a2e] pt-16 pb-12 text-[#a0a0b8] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col items-start gap-4">
            <Logo size="md" />
            <p className="text-sm text-[#a0a0b8] max-w-sm leading-relaxed">
              The verifiable trust engine for independent professionals and boutique agencies. Prove reliability from delivered milestones.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#00ff88]">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span>Verifiable Trust Protocol Online</span>
            </div>
          </div>

          {/* Column 1: Product */}
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
                <Link href="/profile/alexrivera" className="hover:text-[#00ff88] transition-colors">
                  Live Proof Sample
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a href="mailto:hello@voucht.tech" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Social */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm mb-6">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Social
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#00ff88] transition-colors">
                Twitter
              </a>
              <span>&bull;</span>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#00ff88] transition-colors">
                LinkedIn
              </a>
              <span>&bull;</span>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#00ff88] transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a0a0b8]">
          <p>&copy; 2026 Voucht. Built for freelancers who deliver.</p>
          <p className="text-[#a0a0b8]/60">
            Powered by Cryptographic Sign-offs & AI Smart Contracts
          </p>
        </div>
      </div>
    </footer>
  );
}
