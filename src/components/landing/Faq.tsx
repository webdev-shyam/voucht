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
    a: "The score is one number out of 100, calculated by the database from your recorded work: completed projects (40 points), on-time client-confirmed deliveries (25 points), no cancelled projects (20 points), and track record volume (15 points, capped). It recalculates after every confirmed delivery, is stored in one place, and no client or URL parameter can write to it. Until a client confirms a delivery, your page shows \"No verified work history yet\" instead of a number.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The free plan keeps 1 active project, sends client confirmation links, calculates your Trust Score, and hosts your public Proof Page for as long as your account exists. No credit card is required to start.",
  },
  {
    q: "What if a client doesn't confirm delivery?",
    a: "Clients never need an account: they open a single-tap confirmation link sent to their email, and you get reminders for milestones that are still awaiting a reply. A delivery that is not confirmed simply does not count towards your score. It is never marked verified automatically, so your page only shows proof a client actually agreed to.",
  },
  {
    q: "Can I use Voucht with any platform (Upwork, Fiverr, direct clients)?",
    a: "Yes. Voucht records the deliverables and deadlines you enter yourself, so it works for direct clients, agency retainers and platform gigs alike. You share one Proof Page link on Upwork proposals, LinkedIn, your portfolio, or your email signature.",
  },
  {
    q: "How is this different from reviews?",
    a: "A review is a text claim anyone can write. A Voucht record is a dated delivery that a specific client confirmed from their own email link, tied to a milestone deadline and a timestamp. The score is derived from those records, not from star ratings, so it cannot be inflated by friends or bought accounts.",
  },
  {
    q: "Can clients see my score before hiring me?",
    a: "Yes, that is the point. Send prospects your Proof Page link or embed the live SVG badge on your portfolio; it reads the same stored score your dashboard shows, and refreshes within minutes of new confirmed work.",
  },
  {
    q: "What happens if I miss a deadline?",
    a: "A late confirmed delivery counts against the on-time factor, so the score drops. A project you cancel counts against the no-cancelled-work factor. There is a 24 hour grace window, and both factors recover as later deliveries land on time.",
  },
  {
    q: "Is my data safe?",
    a: "Your data lives in a Postgres database with row-level security, so you only ever read and write your own rows, and traffic is encrypted in transit. Client emails and confirmation tokens exist to run the verification flow and are never shown on a public page; public surfaces show a masked name such as \"S***a J.\". There is no self-service delete button yet, so email hello@voucht.tech to remove a project or your whole account, and we do that by hand.",
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
