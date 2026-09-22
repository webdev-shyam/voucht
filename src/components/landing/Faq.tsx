"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How is the Trust Score calculated?",
    a: "Your Trust Score (0-100) is calculated algorithmically using four verifiable factors: On-Time Delivery Rate (35%), Client Milestone Confirmations (30%), Dispute-Free History (20%), and Platform Longevity & Volume (15%). Unlike static review scores, it updates in real time with each delivered milestone.",
  },
  {
    q: "Is it really free?",
    a: "Yes! Our Free plan lets you manage 1 active project, receive client sign-offs, generate a basic Trust Score, and host your public Proof Page forever with zero credit card required.",
  },
  {
    q: "What if a client doesn't confirm delivery?",
    a: "Voucht automatically sends polite follow-up reminders. In addition, clients do not need to sign up or create an account — they confirm deliverables with a single tap from their email. If a client remains unresponsive after 14 days without opening a dispute, the delivery defaults to verified.",
  },
  {
    q: "Can I use Voucht with any platform (Upwork, Fiverr, direct clients)?",
    a: "Absolutely. Voucht works independently with direct clients, agency retainers, and platform gigs. You can link your public Proof Page on Upwork proposals, LinkedIn profiles, personal portfolios, and email signatures.",
  },
  {
    q: "How is this different from reviews?",
    a: "Reviews can be bought, friends can write fake 5-star testimonials, and ratings can be manipulated. Voucht verifies cryptographically signed delivery receipts tied to real project deliverables, timestamps, and client email domains.",
  },
  {
    q: "Can clients see my score before hiring me?",
    a: "Yes! That is the core superpower of Voucht. Send prospects your Proof Page link or embed your live SVG badge on your portfolio so clients see your proven reliability before ever signing a contract.",
  },
  {
    q: "What happens if I miss a deadline?",
    a: "If a milestone deadline is extended mutually with your client, your on-time score is preserved. If an uncommunicated delay occurs, your score adjusts proportionally but can be redeemed through consistent future on-time deliveries.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All data is protected with enterprise-grade encryption at rest and in transit. Client contact emails are never sold, shared, or spammed. You have full control over which client names or financial figures are publicly displayed or masked.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-[#1a1a2e] relative overflow-hidden border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-4">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#a0a0b8]">
            Everything you need to know about the Voucht verifiable trust engine.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-[#00ff88]/40 bg-[#1e1e3f]"
                    : "border-white/10 bg-[#1e1e3f]/60 hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-semibold text-white">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "bg-[#00ff88] text-[#1a1a2e] rotate-180"
                        : "bg-white/5 text-[#a0a0b8]"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-sm sm:text-base text-[#a0a0b8] leading-relaxed border-t border-white/5 mt-1 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
