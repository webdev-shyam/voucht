import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ExampleProofPage } from "@/components/landing/ExampleProofPage";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white flex flex-col selection:bg-[#00ff88] selection:text-[#1a1a2e]">
      {/* SECTION 1 — NAVBAR */}
      <Navbar />

      <main className="flex-1">
        {/* SECTION 2 — HERO */}
        <Hero />

        {/* SECTION 3 — SOCIAL PROOF BAR */}
        <SocialProofBar />

        {/* SECTION 4 — PROBLEM/SOLUTION */}
        <ProblemSolution />

        {/* SECTION 5 — HOW IT WORKS */}
        <HowItWorks />

        {/* SECTION 6 — FEATURES */}
        <Features />

        {/* SECTION 7 — EXAMPLE PROOF PAGE */}
        <ExampleProofPage />

        {/* SECTION 8 — PRICING */}
        <Pricing />

        {/* SECTION 9 — FAQ */}
        <Faq />

        {/* SECTION 10 — FINAL CTA */}
        <FinalCta />
      </main>

      {/* SECTION 11 — FOOTER */}
      <Footer />
    </div>
  );
}
