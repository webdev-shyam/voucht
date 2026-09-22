"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#1a1a2e]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-[#1a1a2e]/60 backdrop-blur-sm border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#a0a0b8]">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/profile/alexrivera"
            className="hover:text-[#00ff88] transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
            <span>Sample Proof</span>
          </Link>
        </nav>

        {/* Right side CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[#a0a0b8] hover:text-white transition-colors px-2 py-1"
          >
            Log In
          </Link>
          <Button asChild variant="electric" size="default" className="gap-2">
            <Link href="/signup">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#a0a0b8] hover:text-white"
                aria-label="Toggle Navigation Menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[350px] bg-[#1a1a2e] border-l border-white/10 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <Logo size="md" />
                </div>

                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-medium text-[#a0a0b8] hover:text-white transition-colors py-2 border-b border-white/5"
                    >
                      {link.label}
                    </a>
                  ))}
                  <Link
                    href="/profile/alexrivera"
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium text-[#00ff88] hover:underline transition-colors py-2 flex items-center gap-2 border-b border-white/5"
                  >
                    <ShieldCheck className="w-5 h-5 text-[#00ff88]" />
                    <span>Sample Proof Page</span>
                  </Link>
                </nav>
              </div>

              <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button
                  asChild
                  variant="electric"
                  className="w-full justify-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/signup">
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
